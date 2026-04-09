// this file defines the StartUI class, 
// which creates the start screen for the game

export class StartUI {
    constructor(scene) {
        this.scene = scene;  // Store the reference to the scene
        this.createUI();
    }

    createUI() {
        this.scene.cameras.main.setBackgroundColor('#2c3e50');

        const centerX = this.scene.cameras.main.width / 2;

        this.scene.add.text(centerX, 200, 'Elemental Tower Defense Game', { 
            fontSize: '48px', fill: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        let startBtn = this.scene.add.text(centerX, 350, '▶ Click to Start', { 
            fontSize: '32px', fill: '#00ff00' 
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerover', () => startBtn.setStyle({ fill: '#ffff00' }));
        startBtn.on('pointerout', () => startBtn.setStyle({ fill: '#00ff00' }));

        startBtn.on('pointerdown', () => {
            // use the scene's scene property to start the GameScene
            this.scene.scene.start('LevelScene'); // start the level selection scene instead of directly starting the game scene
        });
    }
}