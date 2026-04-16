// this file defines the PauseUI class, 
// which creates the pause screen for the game

export class PauseUI {
    constructor(scene) {
        this.scene = scene;
        this.createUI();
    }

    createUI() {
        let gameScene = this.scene.scene.get('GameScene');

        if (gameScene && gameScene.musicSystem) {
            gameScene.musicSystem.pauseBGM(this.scene);
        }

        this.scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.6);

        this.scene.add.text(400, 200, 'Game Paused', { 
            fontSize: '48px', fill: '#ffffff', fontStyle: 'bold' 
        }).setOrigin(0.5);

        let resumeBtn = this.scene.add.text(400, 300, '▶ continue', { 
            fontSize: '32px', fill: '#00ff00' 
        }).setOrigin(0.5).setInteractive();

        resumeBtn.on('pointerdown', () => {
            this.scene.scene.resume('GameScene'); 

            if (gameScene && gameScene.musicSystem) {
                gameScene.musicSystem.resumeBGM();
            }

            this.scene.scene.stop();              
        });

        let restartBtn = this.scene.add.text(400, 380, '↻ restart the game', { 
            fontSize: '32px', fill: '#ffff00' 
        }).setOrigin(0.5).setInteractive();

        restartBtn.on('pointerdown', () => {
            let gameScene = this.scene.scene.get('GameScene');
            let currentLevel = gameScene.currentLevelKey || 'level1';

            this.scene.scene.stop('GameScene');  
            this.scene.scene.stop('GameUI'); 
            this.scene.scene.stop(); // stop the pause scene itself
            
            this.scene.scene.start('GameScene', { levelKey: currentLevel }); 
        });

        let menuBtn = this.scene.add.text(400, 460, '🏠 back to homepage', { 
            fontSize: '32px', fill: '#ffaa00' 
        }).setOrigin(0.5).setInteractive();

        menuBtn.on('pointerdown', () => {

            this.scene.scene.stop('GameScene'); 
            this.scene.scene.stop('GameUI');  
            this.scene.scene.stop(); // stop the pause scene itself 
            this.scene.scene.start('StartScene'); 
        });
    }
}