import Phaser from "phaser"
import { screenSize, debugConfig, renderConfig } from "./gameConfig.json"

// Import scenes
import { InitialLoadingScene } from './InitialLoadingScene.js'
import { TitleScreen } from './TitleScreen.js'
import { Level1Scene } from './Level1Scene.js'
import { UIScene } from './UIScene.js'
import { GameOverUIScene } from './GameOverUIScene.js'
import { VictoryUIScene } from './VictoryUIScene.js'
import { GameCompleteUIScene } from './GameCompleteUIScene.js'

const config = {
  type: Phaser.AUTO,
  width: screenSize.width.value,
  height: screenSize.height.value,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      fps: 120,
      gravity: { y: 0 }, // Default no gravity
      debug: debugConfig.debug.value,
      debugShowBody: debugConfig.debugShowBody.value,
      debugShowStaticBody: debugConfig.debugShowStaticBody.value,
      debugShowVelocity: debugConfig.debugShowVelocity.value,
    },
  },
  pixelArt: renderConfig.pixelArt.value,
  scene: [InitialLoadingScene, TitleScreen, Level1Scene, UIScene, VictoryUIScene, GameCompleteUIScene, GameOverUIScene],
}

export default new Phaser.Game(config)
