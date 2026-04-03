import Phaser from 'phaser'
import { screenSize } from './gameConfig.json'
import { setupLoadingProgressUI } from './utils.js'

export class InitialLoadingScene extends Phaser.Scene {
  constructor() {
    super({
      key: 'InitialLoadingScene'
    })
  }

  preload() {
    // Setup loading progress bar UI
    setupLoadingProgressUI(this)
    
    // Load asset pack by type
    this.load.pack('assetPack', 'assets/asset-pack.json')
  }

  create() {
    // Create simple loading background
    this.cameras.main.setBackgroundColor('#000000')
    
    // Add loading complete prompt
    const screenWidth = screenSize.width.value
    const screenHeight = screenSize.height.value
    
    const loadingCompleteText = this.add.text(screenWidth / 2, screenHeight / 2 + 50, 'Loading Complete!', {
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0.5)

    // Switch to title screen after brief delay
    this.time.delayedCall(1000, () => {
      this.cameras.main.fadeOut(500, 0, 0, 0)
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('TitleScreen')
      })
    })
  }
}