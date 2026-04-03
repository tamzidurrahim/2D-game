import Phaser from 'phaser'
import { screenSize } from './gameConfig.json'

export class UIScene extends Phaser.Scene {
  constructor() {
    super({
      key: "UIScene",
    })
  }

  create() {
    // Create health bar
    this.createHealthBar()
    
    // Create control hints
    this.createControlsHint()
    
    // Get reference to game scene
    this.gameScene = this.scene.get('Level1Scene') || this.scene.get('Level2Scene')
  }

  createHealthBar() {
    const screenWidth = screenSize.width.value
    
    // Health bar background
    this.healthBarBg = this.add.graphics()
    this.healthBarBg.fillStyle(0x000000, 0.5)
    this.healthBarBg.fillRect(20, 20, 200, 20)
    
    // Health bar
    this.healthBar = this.add.graphics()
    
    // Health text
    this.healthText = this.add.text(25, 22, 'HEALTH', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '16px',
      fill: '#ffffff'
    })
  }

  createControlsHint() {
    const screenWidth = screenSize.width.value
    
    // Show control hints in top right
    this.controlsHint = this.add.text(screenWidth - 20, 20, 
      'J: Punch  K: Kick  L: Chidori', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '14px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(1, 0)
  }

  updateHealthBar(healthPercentage) {
    // Clear and redraw health bar
    this.healthBar.clear()
    
    // Choose color based on health percentage
    let color = 0x00ff00 // Green
    if (healthPercentage < 30) {
      color = 0xff0000 // Red
    } else if (healthPercentage < 60) {
      color = 0xffff00 // Yellow
    }
    
    this.healthBar.fillStyle(color)
    this.healthBar.fillRect(22, 22, (196 * healthPercentage / 100), 16)
  }

  update() {
    // Update health display
    if (this.gameScene && this.gameScene.player) {
      const healthPercentage = this.gameScene.player.getHealthPercentage()
      this.updateHealthBar(healthPercentage)
    }
  }
}