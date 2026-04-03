import { BaseLevelScene } from './BaseLevelScene.js'
import { KakashiPlayer } from './KakashiPlayer.js'

import { SoundNinja } from './SoundNinja.js'

export class Level1Scene extends BaseLevelScene {
  constructor() {
    super({
      key: "Level1Scene",
    })
  }

  preload() {
    // Unified asset loading
    this.preloadAllAssets()
  }

  create() {
    // Create basic game elements
    this.createBaseElements()

    // Play background music
    this.backgroundMusic = this.sound.add("ninja_adventure_theme", {
      volume: 0.6,
      loop: true
    })
    this.backgroundMusic.play()
  }

  update() {
    // Call base update method
    this.baseUpdate()
  }

  // Subclass override method: set map size
  setupMapSize() {
    this.mapWidth = 30 * 64  // 30 tiles x 64 pixels
    this.mapHeight = 20 * 64 // 20 tiles x 64 pixels
  }

  // Create player
  createPlayer() {
    // Player spawns on left platform (x: 3 tiles, y: 17 tiles)
    const playerX = 3 * 64
    const playerY = 17 * 64
    
    // Create Kakashi character
    this.player = new KakashiPlayer(this, playerX, playerY)
  }

  // Create enemies
  createEnemies() {
    // Create a Sound Ninja on central low platform (x: 15 tiles, y: 18 tiles)
    const enemy1 = new SoundNinja(this, 15 * 64, 18 * 64)
    this.enemies.add(enemy1)
    
    // Create a Sound Ninja on right high platform (x: 25 tiles, y: 15 tiles)
    const enemy2 = new SoundNinja(this, 25 * 64, 15 * 64)
    this.enemies.add(enemy2)
    
    // Create a Sound Ninja on central floating platform (x: 15 tiles, y: 14 tiles)
    const enemy3 = new SoundNinja(this, 15 * 64, 14 * 64)
    this.enemies.add(enemy3)
  }

  // Create background
  createBackground() {
    // Use Hidden Leaf Village background
    let backgroundKey = "konoha_village_background"
    
    // If specified background does not exist, fallback to default forest background
    if (!this.textures.exists(backgroundKey)) {
      console.warn(`Background ${backgroundKey} not found, using default forest_background`)
      backgroundKey = "forest_background"
    }
    
    // Calculate background scale - make background height equal to map height
    const bgImage = this.add.image(0, 0, backgroundKey).setOrigin(0, 0)
    const bgScale = this.mapHeight / bgImage.height
    bgImage.setScale(bgScale)

    // If background width is less than map width, need to tile
    const scaledBgWidth = bgImage.width * bgScale
    const numRepeats = Math.ceil(this.mapWidth / scaledBgWidth)
    
    // Create multiple background instances for tiling
    for (let i = 0; i < numRepeats; i++) {
      const bg = this.add.image(i * scaledBgWidth, 0, backgroundKey)
        .setOrigin(0, 0)
        .setScale(bgScale)
        .setScrollFactor(0.2) // Set parallax scrolling
    }
  }

  // Create map
  createTileMap() {
    // Create tilemap
    this.map = this.make.tilemap({ key: "level1_map" })
    
    // Add tileset
    this.forestGroundTileset = this.map.addTilesetImage("forest_ground", "forest_ground")
    
    // Create ground layer
    this.groundLayer = this.map.createLayer("ground", this.forestGroundTileset, 0, 0)
    
    // Set collision - exclude empty tiles
    this.groundLayer.setCollisionByExclusion([-1])
  }

  // Create decoration elements
  createDecorations() {
    // Add decoration elements at different positions
    
    // Decorations on left platform
    const tree1 = this.add.image(2 * 64, 17 * 64, "trees_variant_1")
    tree1.setOrigin(0.5, 1)
    tree1.setScale(0.6) // Unified scale ratio
    this.decorations.add(tree1)
    
    const bush1 = this.add.image(6 * 64, 17.5 * 64, "bushes_variant_1")
    bush1.setOrigin(0.5, 1)
    bush1.setScale(0.4) // Unified scale ratio
    this.decorations.add(bush1)
    
    // Decorations in central area
    const tree2 = this.add.image(11 * 64, 18.8 * 64, "trees_variant_2")
    tree2.setOrigin(0.5, 1)
    tree2.setScale(0.6) // Unified scale ratio
    this.decorations.add(tree2)
    
    const rock1 = this.add.image(19 * 64, 19.2 * 64, "rocks_variant_1")
    rock1.setOrigin(0.5, 1)
    rock1.setScale(0.5) // Unified scale ratio
    this.decorations.add(rock1)
    
    // Decorations on right platform
    const tree3 = this.add.image(23 * 64, 15.5 * 64, "trees_variant_3")
    tree3.setOrigin(0.5, 1)
    tree3.setScale(0.6) // Unified scale ratio
    this.decorations.add(tree3)
    
    const woodenPost = this.add.image(27 * 64, 15.5 * 64, "wooden_post_variant_1")
    woodenPost.setOrigin(0.5, 1)
    woodenPost.setScale(0.3) // Unified scale ratio
    this.decorations.add(woodenPost)
    
    // Decorations on floating platform
    const grass1 = this.add.image(10 * 64, 12.8 * 64, "grass_variant_1")
    grass1.setOrigin(0.5, 1)
    grass1.setScale(0.3) // Unified scale ratio
    this.decorations.add(grass1)
    
    const bush2 = this.add.image(16 * 64, 14.8 * 64, "bushes_variant_2")
    bush2.setOrigin(0.5, 1)
    bush2.setScale(0.4) // Unified scale ratio
    this.decorations.add(bush2)
  }
}