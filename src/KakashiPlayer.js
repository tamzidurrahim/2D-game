import Phaser from 'phaser'
import { createTrigger } from './utils.js'
import { kakashiConfig } from './gameConfig.json'

export class KakashiPlayer extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "kakashi_idle_frame1")

    // Add to scene and physics system
    scene.add.existing(this)
    scene.physics.add.existing(this)

    // Character properties
    this.scene = scene
    this.facingDirection = "right"
    this.walkSpeed = kakashiConfig.walkSpeed.value
    this.jumpPower = kakashiConfig.jumpPower.value

    // Status flags
    this.isDead = false // Dead state
    this.isPunching = false // Punching state
    this.isKicking = false // Kicking state
    this.isChidori = false // Chidori state
    this.isSharingan = false // Sharingan state
    this.isHurting = false // Hurt stun state
    this.isInvulnerable = false // Invulnerable state
    this.hurtingDuration = kakashiConfig.hurtingDuration.value // Hurt stun duration
    this.invulnerableTime = kakashiConfig.invulnerableTime.value // Invulnerability time
    
    // Attack target tracking system
    this.currentMeleeTargets = new Set() // Track currently hit targets

    // Player health system
    this.maxHealth = kakashiConfig.maxHealth.value
    this.health = this.maxHealth

    // Set physics properties
    this.body.setGravityY(kakashiConfig.gravityY.value)

    // Set collision box based on idle animation
    this.collisionBoxWidth = 324 * 0.9
    this.collisionBoxHeight = 560 * 0.9
    this.body.setSize(this.collisionBoxWidth, this.collisionBoxHeight)

    // Set character scale
    const standardHeight = 2 * 64
    this.characterScale = standardHeight / 560
    this.setScale(this.characterScale)

    // Set initial origin
    this.setOrigin(0.5, 1.0)

    // Create animations
    this.createAnimations()

    // Play idle animation
    this.play("kakashi_idle_anim")
    this.resetOriginAndOffset()

    // Create attack trigger
    this.createMeleeTrigger()

    // Initialize all sounds
    this.initializeSounds()
    
    // Effects
    this.dustEffects = [] // Changed to array to store multiple dust effects
    this.sharinganEffect = null // Sharingan effect
  }

  // Initialize all sounds
  initializeSounds() {
    this.jumpSound = this.scene.sound.add("ninja_jump_sound", { volume: 0.3 })
    this.punchSound = this.scene.sound.add("punch_sound", { volume: 0.3 })
    this.kickSound = this.scene.sound.add("kick_sound", { volume: 0.3 })
    this.chidoriSound = this.scene.sound.add("chidori_sound", { volume: 0.3 })
    this.sharinganSound = this.scene.sound.add("sharingan_distortion_sound", { volume: 0.3 })
    this.hurtSound = this.scene.sound.add("ninja_hurt_sound", { volume: 0.3 })
    this.dieSound = this.scene.sound.add("ninja_die_sound", { volume: 0.3 })
  }

  createAnimations() {
    const anims = this.scene.anims

    // Idle animation
    if (!anims.exists("kakashi_idle_anim")) {
      anims.create({
        key: "kakashi_idle_anim",
        frames: [
          {
            key: "kakashi_idle_frame1",
            duration: 800,
          },
          {
            key: "kakashi_idle_frame2",
            duration: 800,
          },
        ],
        repeat: -1,
      })
    }

    // Walk animation
    if (!anims.exists("kakashi_walk_anim")) {
      anims.create({
        key: "kakashi_walk_anim",
        frames: [
          {
            key: "kakashi_walk_frame1",
            duration: 300,
          },
          {
            key: "kakashi_walk_frame2",
            duration: 300,
          },
          {
            key: "kakashi_walk_frame3",
            duration: 300,
          },
          {
            key: "kakashi_walk_frame4",
            duration: 300,
          },
        ],
        repeat: -1,
      })
    }

    // Jump Up animation
    if (!anims.exists("kakashi_jump_up_anim")) {
      anims.create({
        key: "kakashi_jump_up_anim",
        frames: [
          {
            key: "kakashi_jump_frame1",
            duration: 200,
          }
        ],
        repeat: 0,
      })
    }

    // Jump Down animation
    if (!anims.exists("kakashi_jump_down_anim")) {
      anims.create({
        key: "kakashi_jump_down_anim",
        frames: [
          {
            key: "kakashi_jump_frame2",
            duration: 300,
          }
        ],
        repeat: 0,
      })
    }

    // Punch animation
    if (!anims.exists("kakashi_punch_anim")) {
      anims.create({
        key: "kakashi_punch_anim",
        frames: [
          {
            key: "kakashi_punch_frame1",
            duration: 50,
          },
          {
            key: "kakashi_punch_frame2",
            duration: 100,
          },
        ],
        repeat: 0,
      })
    }

    // Kick animation
    if (!anims.exists("kakashi_kick_anim")) {
      anims.create({
        key: "kakashi_kick_anim",
        frames: [
          {
            key: "kakashi_kick_frame1",
            duration: 50,
          },
          {
            key: "kakashi_kick_frame2",
            duration: 100,
          },
        ],
        repeat: 0,
      })
    }

    // Chidori animation
    if (!anims.exists("kakashi_chidori_anim")) {
      anims.create({
        key: "kakashi_chidori_anim",
        frames: [
          {
            key: "kakashi_chidori_frame1",
            duration: 100,
          },
          {
            key: "kakashi_chidori_frame2",
            duration: 200,
          },
        ],
        repeat: 0,
      })
    }

    // Die animation
    if (!anims.exists("kakashi_die_anim")) {
      anims.create({
        key: "kakashi_die_anim",
        frames: [
          {
            key: "kakashi_die_frame1",
            duration: 500,
          },
          {
            key: "kakashi_die_frame2",
            duration: 1000,
          },
        ],
        repeat: 0,
      })
    }

    // Sharingan animation
    if (!anims.exists("kakashi_sharingan_anim")) {
      anims.create({
        key: "kakashi_sharingan_anim",
        frames: [
          {
            key: "kakashi_sharingan_frame1",
            duration: 400,
          },
          {
            key: "kakashi_sharingan_frame2",
            duration: 300,
          },
        ],
        repeat: 0,
      })
    }
  }

  update(keys) {
    if (!this.body || !this.active || this.isDead || this.isPunching || this.isKicking || this.isChidori || this.isSharingan || this.isHurting) {
      return
    }

    // Handle death state
    if (!this.isDead) {
      this.handleDying()
    }

    // Handle attack state
    if (!this.isDead && !this.isPunching && !this.isKicking && !this.isChidori && !this.isSharingan && !this.isHurting) {
      this.handleAttacks(keys)
    }

    // Handle movement
    if (!this.isDead && !this.isPunching && !this.isKicking && !this.isChidori && !this.isSharingan && !this.isHurting) {
      this.handleMovement(keys)
    }

    // Update attack trigger
    this.updateMeleeTrigger()
  }

  handleDying() {
    if (this.health <= 0 && !this.isDead) {
      this.health = 0
      this.isDead = true
      this.body.setVelocityX(0)
      this.play("kakashi_die_anim", true)
      this.resetOriginAndOffset()
      this.dieSound.play()
      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
        if (animation.key === "kakashi_die_anim") {
          this.scene.scene.launch("GameOverUIScene", { 
            currentLevelKey: this.scene.scene.key 
          })
        }
      })
    } else if(this.y > this.scene.mapHeight + 100 && !this.isDead) { 
      this.health = 0
      this.isDead = true
      this.scene.scene.launch("GameOverUIScene", { 
        currentLevelKey: this.scene.scene.key 
      })
    }
  }

  handleAttacks(keys) {
    // J key punch attack
    if (Phaser.Input.Keyboard.JustDown(keys.J) && !this.isPunching) {
      // Clear attack target records, start new attack
      this.currentMeleeTargets.clear()
      this.updateMeleeTrigger()
      this.isPunching = true
      this.body.setVelocityX(0) // Stop moving when attacking

      this.play("kakashi_punch_anim", true)
      this.resetOriginAndOffset()
      this.punchSound.play()
      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
        if (animation.key === "kakashi_punch_anim") {
          this.isPunching = false
          // Clear target records when attack ends
          this.currentMeleeTargets.clear()
        }
      })
    }

    // K key kick attack
    if (Phaser.Input.Keyboard.JustDown(keys.K) && !this.isKicking) {
      // Clear attack target records, start new attack
      this.currentMeleeTargets.clear()
      this.updateMeleeTrigger()
      this.isKicking = true
      this.body.setVelocityX(0) // Stop moving when attacking

      this.play("kakashi_kick_anim", true)
      this.resetOriginAndOffset()
      this.kickSound.play()
      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
        if (animation.key === "kakashi_kick_anim") {
          this.isKicking = false
          // Clear target records when attack ends
          this.currentMeleeTargets.clear()
        }
      })
    }

    // L key Chidori attack
    if (Phaser.Input.Keyboard.JustDown(keys.L) && !this.isChidori) {
      // Clear attack target records, start new attack
      this.currentMeleeTargets.clear()
      this.updateMeleeTrigger()
      this.isChidori = true

      // Chidori needs forward dash
      const dashSpeed = this.facingDirection === "right" ? 400 : -400
      this.body.setVelocityX(dashSpeed)

      // Chidori skill screen shake effect
      try {
        if (this.scene && this.scene.cameras && this.scene.cameras.main) {
          this.scene.cameras.main.shake(800, 0.015) // Duration 800ms, strength 0.015 (reduce shake amplitude)
        }
      } catch (error) {
        console.warn("Failed to shake camera for Chidori:", error)
      }

      this.play("kakashi_chidori_anim", true)
      this.resetOriginAndOffset()
      this.chidoriSound.play()
      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
        if (animation.key === "kakashi_chidori_anim") {
          this.isChidori = false
          this.body.setVelocityX(0) // Stop dash
          // Clear target records when attack ends
          this.currentMeleeTargets.clear()
        }
      })
    }

    // U key Sharingan space-time distortion
    if (Phaser.Input.Keyboard.JustDown(keys.U) && !this.isSharingan) {
      this.useSharingan()
    }
  }

  handleMovement(keys) {
    // WASD and Arrow keys movement controls
    if (keys.A.isDown || keys.LEFT.isDown) {
      this.body.setVelocityX(-this.walkSpeed)
      this.facingDirection = "left"
    } else if (keys.D.isDown || keys.RIGHT.isDown) {
      this.body.setVelocityX(this.walkSpeed)
      this.facingDirection = "right"
    } else {
      this.body.setVelocityX(0)
    }

    // Update facing direction
    this.setFlipX(this.facingDirection === "left")

    // Record if on ground before jump
    const wasOnFloor = this.body.blocked.down
    
    // Jump (W or UP arrow)
    if ((keys.W.isDown || keys.UP.isDown) && this.body.blocked.down) {
      this.body.setVelocityY(-this.jumpPower)
      this.jumpSound.play()
      // Show dust effect when jumping
      this.showDustEffect()
    }

    // Detect landing, show dust effect
    if (!wasOnFloor && this.body.blocked.down && this.body.velocity.y >= 0) {
      this.showDustEffect()
    }

    // Update animation
    if (!this.body.blocked.down) {
      if (this.body.velocity.y < 0) {
        // Rising phase
        this.play("kakashi_jump_up_anim", true)
        this.resetOriginAndOffset()
      } else {
        // Falling phase
        this.play("kakashi_jump_down_anim", true)
        this.resetOriginAndOffset()
      }
    } else if (Math.abs(this.body.velocity.x) > 0) {
      // Walking
      this.play("kakashi_walk_anim", true)
      this.resetOriginAndOffset()
    } else {
      // Idle
      this.play("kakashi_idle_anim", true)
      this.resetOriginAndOffset()
    }
  }

  resetOriginAndOffset() {
    // Return corresponding origin data based on different animations
    let baseOriginX = 0.5;
    let baseOriginY = 1.0;
    const currentAnim = this.anims.currentAnim;
    if (currentAnim) {
      switch(currentAnim.key) {
        case "kakashi_idle_anim":
          baseOriginX = 0.5;
          baseOriginY = 1.0;
          break;
        case "kakashi_walk_anim":
          baseOriginX = 0.502;
          baseOriginY = 1.0;
          break;
        case "kakashi_jump_up_anim":
        case "kakashi_jump_down_anim":
          baseOriginX = 0.413;
          baseOriginY = 1.0;
          break;
        case "kakashi_punch_anim":
          baseOriginX = 0.258;
          baseOriginY = 1.0;
          break;
        case "kakashi_kick_anim":
          baseOriginX = 0.305;
          baseOriginY = 1.0;
          break;
        case "kakashi_chidori_anim":
          baseOriginX = 0.254;
          baseOriginY = 1.0;
          break;
        case "kakashi_die_anim":
          baseOriginX = 0.622;
          baseOriginY = 1.0;
          break;
        case "kakashi_sharingan_anim":
          baseOriginX = 0.244;
          baseOriginY = 1.0;
          break;
        default:
          baseOriginX = 0.5;
          baseOriginY = 1.0;
          break;
      }
    }

    let animOriginX = this.facingDirection === "left" ? (1 - baseOriginX) : baseOriginX;
    let animOriginY = baseOriginY;
    
    // Set origin
    this.setOrigin(animOriginX, animOriginY);
    
    // Calculate offset to align collision box bottomCenter with animation frame origin
    this.body.setOffset(
      this.width * animOriginX - this.collisionBoxWidth / 2, 
      this.height * animOriginY - this.collisionBoxHeight
    );
  }

  takeDamage(damage) {
    if (this.isInvulnerable || this.isDead) return
    
    this.health -= damage
    this.isHurting = true
    this.isInvulnerable = true
    this.hurtSound.play()

    // Show damage number effect
    this.showDamageNumber(damage)

    // Hurt stun
    this.scene.time.delayedCall(this.hurtingDuration, () => {
      this.isHurting = false
    })

    // Flash effect during invulnerability time
    let blinkCount = 0
    const blinkInterval = this.scene.time.addEvent({
      delay: 100,
      repeat: this.invulnerableTime / 100 - 1,
      callback: () => {
        this.alpha = this.alpha === 1 ? 0.5 : 1
        blinkCount++
        if (blinkCount >= this.invulnerableTime / 100) {
          this.alpha = 1
          this.isInvulnerable = false
        }
      }
    })
  }

  getHealthPercentage() {
    return (this.health / this.maxHealth) * 100
  }

  // Create attack trigger
  createMeleeTrigger() {
    this.meleeTrigger = createTrigger(this.scene, 0, 0, 150, 120)
  }

  // Update attack trigger
  updateMeleeTrigger() {
    let triggerX = 0
    let triggerY = 0
    let triggerWidth = 150
    let triggerHeight = 120

    const playerCenterX = this.x
    const playerCenterY = this.y - this.body.height / 2

    switch(this.facingDirection) {
      case "right":
        triggerWidth = 150
        triggerHeight = 120
        triggerX = playerCenterX + triggerWidth / 2
        triggerY = playerCenterY
        break;
      case "left":
        triggerWidth = 150
        triggerHeight = 120
        triggerX = playerCenterX - triggerWidth / 2
        triggerY = playerCenterY
        break;
    }
    
    this.meleeTrigger.setPosition(triggerX, triggerY)
    this.meleeTrigger.body.setSize(triggerWidth, triggerHeight)
  }

  // Show dust effect
  showDustEffect() {
    // Create multiple small dust effects, spread left and right
    const dustCount = 3
    const baseY = this.y
    
    for (let i = 0; i < dustCount; i++) {
      const dustEffect = this.scene.add.image(this.x, baseY, "dust_effect")
      dustEffect.setScale(0.15) // Reduce size to avoid blocking character
      dustEffect.setOrigin(0.5, 1)
      
      // Random offset position
      const offsetX = (Math.random() - 0.5) * 80 // Left-right random offset
      const offsetY = Math.random() * 10 // Slight vertical offset
      dustEffect.x += offsetX
      dustEffect.y += offsetY
      
      // Add to array
      this.dustEffects.push(dustEffect)
      
      // Dust effect fade and spread animation
      this.scene.tweens.add({
        targets: dustEffect,
        alpha: 0,
        scaleX: dustEffect.scaleX * 1.5, // Spread effect
        scaleY: dustEffect.scaleY * 1.5,
        x: dustEffect.x + (offsetX > 0 ? 30 : -30), // Continue spreading to both sides
        duration: 600,
        onComplete: () => {
          if (dustEffect) {
            dustEffect.destroy()
            // Remove from array
            const index = this.dustEffects.indexOf(dustEffect)
            if (index > -1) {
              this.dustEffects.splice(index, 1)
            }
          }
        }
      })
    }
  }

  // Sharingan space-time distortion attack
  useSharingan() {
    // Find nearest enemy
    const nearestEnemy = this.findNearestEnemy()
    if (!nearestEnemy) return // Do not execute when no enemies
    
    this.isSharingan = true
    this.body.setVelocityX(0) // Stop moving when using Sharingan
    
    // Play Sharingan sound effect
    this.sharinganSound.play()
    
    // Play Sharingan pre-attack animation
    this.play("kakashi_sharingan_anim", true)
    this.resetOriginAndOffset()
    
    // Start space-time distortion after animation completes
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
      if (animation.key === "kakashi_sharingan_anim") {
        // Check if scene and camera are still valid
        if (!this.scene || !this.scene.cameras || !this.scene.cameras.main || !this.active) {
          return // Return directly if scene or object is invalid
        }
        
        // VFX effect and shake start simultaneously
        // Sharingan skill screen shake effect - synchronized with VFX, reduce shake strength
        try {
          this.scene.cameras.main.shake(2500, 0.015) // Duration 2500ms, strength 0.015 (reduce shake amplitude)
        } catch (error) {
          console.warn("Failed to shake camera:", error)
          // If shake fails, continue with other logic
        }
        
        // Create space-time distortion effect at enemy position
        if (nearestEnemy && nearestEnemy.active) {
          this.sharinganEffect = this.scene.add.image(nearestEnemy.x, nearestEnemy.y - nearestEnemy.body.height / 2, "red_sharingan_distortion")
          this.sharinganEffect.setScale(0.4)
          this.sharinganEffect.setOrigin(0.5, 0.5)
        } else {
          // If enemy is invalid, skill ends
          this.isSharingan = false
          return
        }
        
        // Rotation and pulse animation
        if (this.scene.tweens && this.sharinganEffect) {
          this.scene.tweens.add({
            targets: this.sharinganEffect,
            rotation: Math.PI * 4, // Rotate two full turns
            scaleX: 0.6,
            scaleY: 0.6,
            duration: 1500,
            ease: 'Power2.easeInOut'
          })
          
          // Fade animation
          this.scene.tweens.add({
            targets: this.sharinganEffect,
            alpha: 0,
            duration: 2000,
            delay: 500,
            onComplete: () => {
              if (this.sharinganEffect) {
                this.sharinganEffect.destroy()
                this.sharinganEffect = null
              }
              // Force stop shake effect when VFX ends
              if (this.scene && this.scene.cameras && this.scene.cameras.main && this.scene.cameras.main.shakeEffect) {
                try {
                  this.scene.cameras.main.shakeEffect.destroy()
                } catch (error) {
                  console.warn("Failed to destroy shake effect:", error)
                }
              }
              // Ensure camera resumes normal follow, but first check if player object is still valid
              if (this.active && this.scene && this.scene.cameras && this.scene.cameras.main) {
                try {
                  this.scene.cameras.main.stopFollow()
                  this.scene.cameras.main.startFollow(this)
                } catch (error) {
                  console.warn("Failed to restore camera follow:", error)
                }
              }
            }
          })
        }
        
        // Delay enemy death (space-time distortion takes time)
        this.scene.time.delayedCall(1000, () => {
          if (nearestEnemy && nearestEnemy.active && !nearestEnemy.isDead) {
            // Directly kill enemy, no regular damage
            nearestEnemy.health = 0
            nearestEnemy.isDead = true
            nearestEnemy.body.setVelocityX(0)
            nearestEnemy.play("sound_ninja_die_anim", true)
            nearestEnemy.resetOriginAndOffset()
            nearestEnemy.dieSound.play()
            
            nearestEnemy.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
              if (animation.key === "sound_ninja_die_anim") {
                nearestEnemy.setActive(false)
                nearestEnemy.setVisible(false)
              }
            })
          }
        })
        
        // Sharingan state duration
        this.scene.time.delayedCall(2000, () => {
          this.isSharingan = false
        })
      }
    })
  }

  // Find nearest enemy
  findNearestEnemy() {
    const enemies = this.scene.enemies.children.entries.filter(enemy => 
      enemy.active && !enemy.isDead
    )
    
    if (enemies.length === 0) return null
    
    let nearestEnemy = null
    let nearestDistance = Infinity
    
    enemies.forEach(enemy => {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestEnemy = enemy
      }
    })
    
    return nearestEnemy
  }

  // Show damage number effect
  showDamageNumber(damage) {
    // Calculate display position (character top right)
    const offsetX = 40 + Math.random() * 20 // Top right position, plus random offset
    const offsetY = -60 - Math.random() * 20 // Above position, plus random offset
    
    // Player damage shown in red
    const color = '#ff3333'
    const fontSize = '28px'
    
    // Create damage number text
    const damageText = this.scene.add.text(
      this.x + offsetX,
      this.y + offsetY,
      `-${damage}`,
      {
        fontFamily: 'RetroPixel, monospace',
        fontSize: fontSize,
        fill: color,
        stroke: '#000000',
        strokeThickness: 4,
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: '#000000',
          blur: 4,
          fill: true
        }
      }
    ).setOrigin(0.5, 0.5)
    
    // Add bounce and fade animation
    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 80, // Fly upward
      x: damageText.x + (Math.random() - 0.5) * 40, // Slight left-right drift
      scaleX: 1.4,
      scaleY: 1.4,
      alpha: 0,
      duration: 1200,
      ease: 'Power2.easeOut',
      onComplete: () => {
        damageText.destroy()
      }
    })
    
    // Additional bounce effect
    this.scene.tweens.add({
      targets: damageText,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 100,
      yoyo: true,
      ease: 'Back.easeOut'
    })
  }
}