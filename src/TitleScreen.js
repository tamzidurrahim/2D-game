import Phaser from 'phaser'
import { screenSize } from './gameConfig.json'

export class TitleScreen extends Phaser.Scene {
  constructor() {
    super({
      key: "TitleScreen",
    })
    this.isStarting = false
  }

  init() {
    this.isStarting = false
  }

  preload() {
    // Resources are loaded in InitialLoadingScene, no need to load again here
  }

  create() {
    // Create background
    this.createBackground()
    this.createUI()
    this.setupInputs()
    this.playBackgroundMusic()
  }

  // Create background (use level 1 background)
  createBackground() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    
    // Calculate background scale
    const bgImage = this.add.image(0, 0, "forest_background").setOrigin(0, 0)
    const bgScaleX = screenWidth / bgImage.width
    const bgScaleY = screenHeight / bgImage.height
    const bgScale = Math.max(bgScaleX, bgScaleY) // Use larger scale ratio to ensure complete coverage
    
    bgImage.setScale(bgScale)
    
    // Center background
    bgImage.x = (screenWidth - bgImage.width * bgScale) / 2
    bgImage.y = (screenHeight - bgImage.height * bgScale) / 2
  }

  createUI() {
    this.createGameTitle()
    this.createPressEnterText()
  }

  createGameTitle() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    
    this.gameTitle = this.add.image(screenWidth / 2, screenHeight * 0.35, "game_title")
    
    const maxTitleWidth = screenWidth * 0.7
    const maxTitleHeight = screenHeight * 0.6

    if (this.gameTitle.width / this.gameTitle.height > maxTitleWidth / maxTitleHeight) {
        this.gameTitle.setScale(maxTitleWidth / this.gameTitle.width)
    } else {
        this.gameTitle.setScale(maxTitleHeight / this.gameTitle.height)
    }
    // Ensure top distance is 50px
    this.gameTitle.y = 50 + this.gameTitle.displayHeight / 2
  }

  createPressEnterText() {
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    
    // Create PRESS ENTER text (centered at bottom)
    this.pressEnterText = this.add.text(screenWidth / 2, screenHeight * 0.75, 'PRESS ENTER TO START', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: Math.min(screenWidth / 20, 48) + 'px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 10,
      align: 'center'
    }).setOrigin(0.5, 0.5)

    // Ensure bottom distance is 80px
    this.pressEnterText.y = screenHeight - 80 - this.pressEnterText.displayHeight / 2

    // Add blinking animation
    this.tweens.add({
      targets: this.pressEnterText,
      alpha: 0.3,
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })
    
    // Add control instructions
    this.controlsText = this.add.text(screenWidth / 2, this.pressEnterText.y + 60, 
      'WASD: Move  |  J: Punch  |  K: Kick  |  L: Chidori', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: Math.min(screenWidth / 40, 24) + 'px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 5,
      align: 'center'
    }).setOrigin(0.5, 0.5)
  }

  // Setup input listeners
  setupInputs() {
    // Enter key
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    
    // Mouse click
    this.input.on('pointerdown', () => {
      this.startGame()
    })
    
    // Keyboard listener
    this.input.keyboard.on('keydown', (event) => {
      if (event.code === 'Enter' || event.code === 'Space') {
        this.startGame()
      }
    })
  }

  // Play background music
  playBackgroundMusic() {
    this.backgroundMusic = this.sound.add("ninja_adventure_theme", {
      volume: 0.6,
      loop: true
    })
    this.backgroundMusic.play()
  }

  // Start game
  startGame() {
    if (this.isStarting) return
    
    this.isStarting = true
    
    // Play click sound effect
    this.sound.play("ui_click_sound", { volume: 0.3 })
    
    // Stop background music
    if (this.backgroundMusic) {
      this.backgroundMusic.stop()
    }
    

    
    // Fade out then switch to game loading scene
    this.cameras.main.fadeOut(500, 0, 0, 0)
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start("Level1Scene")
    })
  }

  update() {
    // Check Enter key or Space key
    if (Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.startGame()
    }
  }
}