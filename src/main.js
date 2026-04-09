// this is a file to store the main code for this game

// import the scences we created
import { StartScene } from './scenes/StartScene.js';
import { GameScene } from './scenes/GameScene.js';
import { PauseScene } from './scenes/PauseScene.js';
import { GameUI } from './ui/GameUI.js';

// game configuration settings
const config = {
    type: Phaser.AUTO,
    width: 1000,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    // register the scenes we created, 
    // the game will start with the first scene in this list (StartScene)
    scene: [StartScene, GameScene, GameUI, PauseScene]
};

const game = new Phaser.Game(config);