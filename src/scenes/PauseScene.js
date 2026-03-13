// this is a file to store the pause scene of the game, 
// which will be shown when players click the pause button during the game

export class PauseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PauseScene' });
    }

    create() {
        // draw a semi-transparent black rectangle to cover the game scene, 
        // making the pause menu more visible
        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.6);

        this.add.text(400, 200, 'Game Paused', { 
            fontSize: '48px', fill: '#ffffff', fontStyle: 'bold' 
        }).setOrigin(0.5);

        // continue button
        let resumeBtn = this.add.text(400, 300, '▶ continue', { 
            fontSize: '32px', fill: '#00ff00' 
        }).setOrigin(0.5).setInteractive();

        resumeBtn.on('pointerdown', () => {
            this.scene.resume('GameScene'); // resume the game scene, let the game continue from where it was paused
            this.scene.stop();              // close the pause menu scene
        });

        // restart button
        let restartBtn = this.add.text(400, 380, '↻ restart the game', { 
            fontSize: '32px', fill: '#ffff00' 
        }).setOrigin(0.5).setInteractive();

        restartBtn.on('pointerdown', () => {
            this.scene.stop('GameScene');   // close the game scene
            this.scene.start('GameScene'); // restart the game scene, which will trigger init() and create() again
        });

        // home button
        let menuBtn = this.add.text(400, 460, '🏠 back to homepage', { 
            fontSize: '32px', fill: '#ffaa00' 
        }).setOrigin(0.5).setInteractive();

        menuBtn.on('pointerdown', () => {
            this.scene.stop('GameScene');   // close the game scene
            this.scene.start('StartScene'); // change to StartScene, which is our main menu
        });
    }
}