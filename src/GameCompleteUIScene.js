import Phaser from 'phaser'
import { screenSize } from './gameConfig.json'

export class GameCompleteUIScene extends Phaser.Scene {
  constructor() {
    super({
      key: "GameCompleteUIScene",
    })
  }

  init(data) {
    this.currentLevelKey = data.currentLevelKey
  }

  create() {
    // Pause main game scene
    this.scene.pause(this.currentLevelKey)
    
    // Create semi-transparent black overlay
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    
    this.add.rectangle(screenWidth / 2, screenHeight / 2, screenWidth, screenHeight, 0x000000, 0.7)
    
    // Game Complete text
    this.completeText = this.add.text(screenWidth / 2, screenHeight / 2 - 100, 'GAME COMPLETE!', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '64px',
      fill: '#ffd700',
      stroke: '#000000',
      strokeThickness: 8,
      align: 'center'
    }).setOrigin(0.5, 0.5)
    
    // Congratulations text
    this.congratsText = this.add.text(screenWidth / 2, screenHeight / 2 - 20, 'Congratulations, Ninja!', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '32px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5, 0.5)
    
    // Return to main menu prompt
    this.menuText = this.add.text(screenWidth / 2, screenHeight / 2 + 80, 'PRESS ENTER TO RETURN TO MENU', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '24px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5, 0.5)
    
    // Add blinking animation
    this.tweens.add({
      targets: this.menuText,
      alpha: 0.3,
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })
    
    // Add celebration animation
    this.tweens.add({
      targets: this.completeText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 1500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })
    
    // Setup input listeners
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.returnToMenu()
    }
  }

  returnToMenu() {
    // Play click sound effect
    this.sound.play("ui_click_sound", { volume: 0.3 })
    
    // Stop all scenes and return to title screen
    this.scene.stop(this.currentLevelKey)
    this.scene.stop("UIScene")
    this.scene.stop()
    this.scene.start("TitleScreen")
  }
}