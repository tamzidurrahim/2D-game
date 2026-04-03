import Phaser from 'phaser'
import { createTrigger } from './utils.js'
import { soundNinjaConfig } from './gameConfig.json'

export class SoundNinja extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "sound_ninja_idle_frame1")

    // Add to scene and physics system
    scene.add.existing(this)
    scene.physics.add.existing(this)

    // Character properties
    this.scene = scene
    this.facingDirection = "left" // Default facing left
    this.walkSpeed = soundNinjaConfig.walkSpeed.value
    
    // Patrol properties
    this.patrolStartX = x
    this.patrolDistance = soundNinjaConfig.patrolDistance.value
    this.patrolLeftBound = this.patrolStartX - this.patrolDistance / 2
    this.patrolRightBound = this.patrolStartX + this.patrolDistance / 2

    // AI state
    this.aiState = "patrol" // patrol, chase, attack
    this.detectionRange = soundNinjaConfig.detectionRange.value
    this.lastAttackTime = 0
    this.attackCooldown = soundNinjaConfig.attackCooldown.value

    // Status flags
    this.isDead = false
    this.isAttacking = false
    this.isHurting = false
    
    // Attack target tracking system
    this.currentMeleeTargets = new Set()

    // Health system
    this.maxHealth = soundNinjaConfig.maxHealth.value
    this.health = this.maxHealth

    // Set physics properties (side-scrolling needs gravity)
    this.body.setGravityY(1200)

    // Set collision box based on idle animation
    this.collisionBoxWidth = 290 * 0.9
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
    this.play("sound_ninja_idle_anim")
    this.resetOriginAndOffset()

    // Create attack trigger
    this.createMeleeTrigger()

    // Initialize sound effects
    this.initializeSounds()
  }

  // Initialize all sound effects
  initializeSounds() {
    this.attackSound = this.scene.sound.add("ninja_slash_sound", { volume: 0.3 })
    this.hurtSound = this.scene.sound.add("ninja_hurt_sound", { volume: 0.3 })
    this.dieSound = this.scene.sound.add("ninja_die_sound", { volume: 0.3 })
  }

  createAnimations() {
    const anims = this.scene.anims

    // Idle animation
    if (!anims.exists("sound_ninja_idle_anim")) {
      anims.create({
        key: "sound_ninja_idle_anim",
        frames: [
          {
            key: "sound_ninja_idle_frame1",
            duration: 800,
          },
          {
            key: "sound_ninja_idle_frame2",
            duration: 800,
          },
        ],
        repeat: -1,
      })
    }

    // Walk animation
    if (!anims.exists("sound_ninja_walk_anim")) {
      anims.create({
        key: "sound_ninja_walk_anim",
        frames: [
          {
            key: "sound_ninja_walk_frame1",
            duration: 300,
          },
          {
            key: "sound_ninja_walk_frame2",
            duration: 300,
          },
          {
            key: "sound_ninja_walk_frame3",
            duration: 300,
          },
          {
            key: "sound_ninja_walk_frame4",
            duration: 300,
          },
        ],
        repeat: -1,
      })
    }

    // Attack animation
    if (!anims.exists("sound_ninja_attack_anim")) {
      anims.create({
        key: "sound_ninja_attack_anim",
        frames: [
          {
            key: "sound_ninja_attack_frame1",
            duration: 50,
          },
          {
            key: "sound_ninja_attack_frame2",
            duration: 100,
          },
        ],
        repeat: 0,
      })
    }

    // Die animation
    if (!anims.exists("sound_ninja_die_anim")) {
      anims.create({
        key: "sound_ninja_die_anim",
        frames: [
          {
            key: "sound_ninja_die_frame1",
            duration: 500,
          },
          {
            key: "sound_ninja_die_frame2",
            duration: 1000,
          },
        ],
        repeat: 0,
      })
    }
  }

  update() {
    if (!this.body || !this.active || this.isDead || this.isAttacking || this.isHurting) {
      // Update attack trigger position (needs updating even in attack state)
      this.updateMeleeTrigger()
      return
    }

    // Handle death state
    if (!this.isDead) {
      this.handleDying()
    }

    // AI logic
    if (!this.isDead && !this.isAttacking && !this.isHurting) {
      this.handleAI()
    }

    // Update attack trigger
    this.updateMeleeTrigger()
  }

  handleDying() {
    if (this.health <= 0 && !this.isDead) {
      this.health = 0
      this.isDead = true
      this.body.setVelocityX(0)
      this.play("sound_ninja_die_anim", true)
      this.resetOriginAndOffset()
      this.dieSound.play()
      
      // Set to inactive, but keep in scene for cleanup checks
      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
        if (animation.key === "sound_ninja_die_anim") {
          this.setActive(false)
        }
      })
    }
  }

  handleAI() {
    const player = this.scene.player
    if (!player || player.isDead) return

    const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)

    // State machine logic
    switch (this.aiState) {
      case "patrol":
        this.handlePatrol()
        // Detect player
        if (distanceToPlayer <= this.detectionRange) {
          this.aiState = "chase"
        }
        break
        
      case "chase":
        this.handleChase(player)
        // Detect attack range
        if (distanceToPlayer <= 80 && this.canAttack()) {
          this.aiState = "attack"
        }
        // Detect if target is lost
        else if (distanceToPlayer > this.detectionRange * 1.5) {
          this.aiState = "patrol"
        }
        break
        
      case "attack":
        this.handleAttack()
        break
    }

    // Update facing direction
    this.setFlipX(this.facingDirection === "left")
  }

  handlePatrol() {
    // Patrol logic
    if (this.facingDirection === "left" && this.x <= this.patrolLeftBound) {
      this.facingDirection = "right"
    } else if (this.facingDirection === "right" && this.x >= this.patrolRightBound) {
      this.facingDirection = "left"
    }

    // Move
    const velocity = this.facingDirection === "left" ? -this.walkSpeed * 0.5 : this.walkSpeed * 0.5
    this.body.setVelocityX(velocity)

    // Play walking animation
    this.play("sound_ninja_walk_anim", true)
    this.resetOriginAndOffset()
  }

  handleChase(player) {
    // Chase player
    if (player.x < this.x) {
      this.facingDirection = "left"
      this.body.setVelocityX(-this.walkSpeed)
    } else {
      this.facingDirection = "right"
      this.body.setVelocityX(this.walkSpeed)
    }

    // Play walking animation
    this.play("sound_ninja_walk_anim", true)
    this.resetOriginAndOffset()
  }

  handleAttack() {
    if (!this.canAttack()) {
      this.aiState = "chase"
      return
    }

    // Clear attack target records, start new attack
    this.currentMeleeTargets.clear()
    this.updateMeleeTrigger()
    this.isAttacking = true
    this.body.setVelocityX(0) // Stop moving when attacking

    this.play("sound_ninja_attack_anim", true)
    this.resetOriginAndOffset()
    this.attackSound.play()
    
    this.lastAttackTime = this.scene.time.now

    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
      if (animation.key === "sound_ninja_attack_anim") {
        this.isAttacking = false
        this.aiState = "chase"
        // Clear target records when attack ends
        this.currentMeleeTargets.clear()
      }
    })
  }

  canAttack() {
    return this.scene.time.now - this.lastAttackTime >= this.attackCooldown
  }

  resetOriginAndOffset() {
    // Return corresponding origin data based on different animations
    let baseOriginX = 0.5;
    let baseOriginY = 1.0;
    const currentAnim = this.anims.currentAnim;
    if (currentAnim) {
      switch(currentAnim.key) {
        case "sound_ninja_idle_anim":
          baseOriginX = 0.5;
          baseOriginY = 1.0;
          break;
        case "sound_ninja_walk_anim":
          baseOriginX = 0.556;
          baseOriginY = 1.0;
          break;
        case "sound_ninja_attack_anim":
          baseOriginX = 0.272;
          baseOriginY = 1.0;
          break;
        case "sound_ninja_die_anim":
          baseOriginX = 0.363;
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
    if (this.isDead) return
    
    this.health -= damage
    this.isHurting = true
    this.hurtSound.play()

    // Show damage number effect
    this.showDamageNumber(damage)

    // Switch to chase state (will actively chase player after being attacked)
    this.aiState = "chase"

    // Hurt stun
    this.scene.time.delayedCall(100, () => {
      this.isHurting = false
    })

    // Brief flash when hurt
    let blinkCount = 0
    const blinkInterval = this.scene.time.addEvent({
      delay: 50,
      repeat: 5,
      callback: () => {
        this.alpha = this.alpha === 1 ? 0.5 : 1
        blinkCount++
        if (blinkCount >= 6) {
          this.alpha = 1
        }
      }
    })
  }

  // Create attack trigger
  createMeleeTrigger() {
    this.meleeTrigger = createTrigger(this.scene, 0, 0, 120, 100)
  }

  // Update attack trigger
  updateMeleeTrigger() {
    let triggerX = 0
    let triggerY = 0
    let triggerWidth = 120
    let triggerHeight = 100

    const enemyCenterX = this.x
    const enemyCenterY = this.y - this.body.height / 2

    switch(this.facingDirection) {
      case "right":
        triggerX = enemyCenterX + triggerWidth / 2
        triggerY = enemyCenterY
        break;
      case "left":
        triggerX = enemyCenterX - triggerWidth / 2
        triggerY = enemyCenterY
        break;
    }
    
    this.meleeTrigger.setPosition(triggerX, triggerY)
    this.meleeTrigger.body.setSize(triggerWidth, triggerHeight)
  }

  // Show damage number effect
  showDamageNumber(damage) {
    // Calculate display position (character top right)
    const offsetX = 40 + Math.random() * 20 // Top right position, plus random offset
    const offsetY = -60 - Math.random() * 20 // Above position, plus random offset
    
    // Choose color and font size based on damage value
    let color = '#ffffff'
    let fontSize = '24px'
    
    if (damage >= 50) {
      color = '#ff0000' // Red, high damage
      fontSize = '32px'
    } else if (damage >= 30) {
      color = '#ffaa00' // Orange, medium damage
      fontSize = '28px'
    } else {
      color = '#ffff00' // Yellow, low damage
      fontSize = '24px'
    }
    
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
        strokeThickness: 3,
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: '#000000',
          blur: 3,
          fill: true
        }
      }
    ).setOrigin(0.5, 0.5)
    
    // Add bounce and fade animation
    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 80, // Fly upward
      x: damageText.x + (Math.random() - 0.5) * 40, // Slight left-right drift
      scaleX: 1.3,
      scaleY: 1.3,
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
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true,
      ease: 'Back.easeOut'
    })
  }
}