import Phaser from 'phaser'
import { KakashiPlayer } from './KakashiPlayer.js'


import { SoundNinja } from './SoundNinja.js'
import { screenSize } from './gameConfig.json'

export class BaseLevelScene extends Phaser.Scene {
  constructor(config) {
    super(config)
  }

  // Unified asset loading using asset-pack.json
  preloadAllAssets() {
    // Load asset pack by type
    this.load.pack('assetPack', 'assets/asset-pack.json')
  }

  // Level sequence list
  static LEVEL_ORDER = [
    "Level1Scene"
  ]

  // Get next level scene key
  getNextLevelScene() {
    const currentIndex = BaseLevelScene.LEVEL_ORDER.indexOf(this.scene.key)
    if (currentIndex >= 0 && currentIndex < BaseLevelScene.LEVEL_ORDER.length - 1) {
      return BaseLevelScene.LEVEL_ORDER[currentIndex + 1]
    }
    return null
  }

  // Check if this is the last level
  isLastLevel() {
    const currentIndex = BaseLevelScene.LEVEL_ORDER.indexOf(this.scene.key)
    return currentIndex === BaseLevelScene.LEVEL_ORDER.length - 1
  }

  // Get first level scene key
  static getFirstLevelScene() {
    return BaseLevelScene.LEVEL_ORDER[0]
  }

  // General creation method
  createBaseElements() {
    // Initialize gameCompleted flag
    this.gameCompleted = false

    // Setup map size
    this.setupMapSize()

    // Create background
    this.createBackground()

    // Create map
    this.createTileMap()

    // Create decoration elements
    this.decorations = this.add.group()
    this.createDecorations()

    // Create enemies
    this.enemies = this.add.group()
    this.createEnemies()

    // Create player
    this.createPlayer()

    // Setup basic collisions
    this.setupBaseCollisions()

    // Setup player world boundary collision
    this.player.body.setCollideWorldBounds(true)

    // Setup camera
    this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight)
    this.cameras.main.startFollow(this.player)
    this.cameras.main.setLerp(0.1, 0.1)

    // Setup world boundaries (side-scroll game only enables left/right/top collisions)
    this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight, true, true, true, false)

    // Create input controls
    this.setupInputs()

    // Setup attack collision detection
    this.setupMeleeCollision()

    // Show UI
    this.scene.launch("UIScene")
  }

  setupBaseCollisions() {
    // Player collision with ground
    this.physics.add.collider(this.player, this.groundLayer)
    
    // Enemy collision with ground
    this.physics.add.collider(this.enemies, this.groundLayer)

    // Player takes damage when colliding with enemies
    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
      if (player.isInvulnerable || player.isHurting || player.isDead || enemy.isDead) return
      
      // Knockback effect
      const knockbackForce = player.x < enemy.x ? -200 : 200
      player.body.setVelocityX(knockbackForce)
      
      player.takeDamage(20)
    })
  }

  setupInputs() {
    // Create WASD key inputs
    this.keys = {
      W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      J: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J),
      K: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K),
      L: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L),
      U: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.U),
      // Add arrow keys support
      UP: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      DOWN: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      LEFT: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      RIGHT: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT)
    }
  }

  // Setup attack collision detection
  setupMeleeCollision() {
    // Setup player attack trigger collision detection with enemies
    this.physics.add.overlap(
      this.player.meleeTrigger,
      this.enemies,
      (trigger, enemy) => {
        // Check Kakashi attack state
        const isAttacking = this.player.isPunching || this.player.isKicking || 
                           this.player.isChidori || this.player.isSharingan
        
        if (isAttacking && !this.player.currentMeleeTargets.has(enemy)) {
          // Do not respond when dead or hurt
          if (enemy.isHurting || enemy.isDead) return
          // Add enemy to attacked list
          this.player.currentMeleeTargets.add(enemy)
          
          // Knockback effect
          const knockbackForce = enemy.x < this.player.x ? -300 : 300
          enemy.body.setVelocityX(knockbackForce)
          
          // Deal different damage based on attack type
          let damage = 20
          if (this.player.isPunching) damage = 20
          else if (this.player.isKicking) damage = 25
          else if (this.player.isChidori) damage = 50 // Kakashi Chidori deals massive damage
          else if (this.player.isSharingan) damage = 9999 // Kakashi Sharingan directly kills
          
          // Finally call takeDamage
          enemy.takeDamage(damage)
        }
      }
    )

    // Setup attack collision detection separately for each enemy
    this.enemies.children.entries.forEach(enemy => {
      this.physics.add.overlap(
        enemy.meleeTrigger,
        this.player,
        (trigger, player) => {
          if (enemy.isAttacking && !enemy.currentMeleeTargets.has(player)) {
            // Do not respond when dead or hurt
            if (player.isHurting || player.isDead || player.isInvulnerable) return
            // Add player to attacked list
            enemy.currentMeleeTargets.add(player)
            
            // Knockback effect
            const knockbackForce = player.x < enemy.x ? -200 : 200
            player.body.setVelocityX(knockbackForce)
            
            // Finally call takeDamage
            player.takeDamage(15)
          }
        }
      )
    })

  }



  // General update method
  baseUpdate() {
    // Update player
    this.player.update(this.keys)

    // Update enemies
    this.enemies.children.entries.forEach(enemy => {
      if (enemy.active) {
        enemy.update()
      }
    })



    // Check if all enemies are defeated
    this.checkEnemiesDefeated()
  }

  // Check if all enemies are defeated (general method)
  checkEnemiesDefeated() {
    const currentEnemyCount = this.enemies.children.entries.filter(enemy => enemy.active).length
    
    // If all enemies are defeated, launch corresponding UI scene
    if (currentEnemyCount === 0 && !this.gameCompleted) {
      this.gameCompleted = true

      if (this.isLastLevel()) {
        console.log("Game completed!")
        this.scene.launch("GameCompleteUIScene", { 
          currentLevelKey: this.scene.key
        })
      } else {
        this.scene.launch("VictoryUIScene", { 
          currentLevelKey: this.scene.key
        })
      }
    }
  }

  // Method to setup map size - subclass needs to override
  setupMapSize() {
    throw new Error("setupMapSize method must be implemented by subclass")
  }

  // Method that subclass needs to override
  createPlayer() {
    throw new Error("createPlayer method must be implemented by subclass")
  }

  createEnemies() {
    throw new Error("createEnemies method must be implemented by subclass")
  }

  createBackground() {
    throw new Error("createBackground method must be implemented by subclass")
  }

  createTileMap() {
    throw new Error("createTileMap method must be implemented by subclass")
  }

  createDecorations() {
    throw new Error("createDecorations method must be implemented by subclass")
  }

  // Display damage numbers
  showDamageNumber(x, y, damage) {
    // Determine damage number color and size
    let color = '#ffffff'
    let fontSize = 24
    
    if (damage >= 100) {
      color = '#ff0000' // Red - ultra high damage
      fontSize = 32
    } else if (damage >= 50) {
      color = '#ff6600' // Orange - high damage
      fontSize = 28
    } else if (damage >= 30) {
      color = '#ffff00' // Yellow - medium damage
      fontSize = 26
    }

    // Create damage text
    const damageText = this.add.text(x, y, damage.toString(), {
      fontFamily: 'RetroPixel, monospace',
      fontSize: fontSize + 'px',
      fill: color,
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0.5)

    // Damage number animation
    this.tweens.add({
      targets: damageText,
      y: y - 60,
      alpha: 0,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        damageText.destroy()
      }
    })
  }
}