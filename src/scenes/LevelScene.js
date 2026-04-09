// this file is responsible for managing menus of levels

export class LevelScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelScene' });
    }

    create() {
        // 1. dark background
        this.cameras.main.setBackgroundColor('#2c3e50');

        const centerX = this.cameras.main.width / 2;
        
        // 2. title text
        this.add.text(centerX, 100, 'level selection', { 
            fontSize: '48px', fill: '#ffffff', fontStyle: 'bold' 
        }).setOrigin(0.5);

        // 3.1. create level 1 button
        let level1Btn = this.add.text(centerX, 250, 'Level 1: Tutorial', { 
            fontSize: '32px', fill: '#00ff00', backgroundColor: '#34495e', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        // 3.2. start GameScene with level1 data when button is clicked
        level1Btn.on('pointerdown', () => {
            this.scene.start('GameScene', { levelKey: 'level1' }); 
        });

        // 4.1. create level 2 button
        let level2Btn = this.add.text(centerX, 350, 'Level 2: First Battle', { 
            fontSize: '32px', fill: '#ffaa00', backgroundColor: '#34495e', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        // 4.2. start GameScene with level2 data when button is clicked
        level2Btn.on('pointerdown', () => {
            this.scene.start('GameScene', { levelKey: 'level2' }); 
        });

        // 5. return to start menu button
        let backBtn = this.add.text(centerX, 500, 'Back to Menu', { 
            fontSize: '24px', fill: '#ffffff'
        }).setOrigin(0.5).setInteractive();

        backBtn.on('pointerdown', () => {
            this.scene.start('StartScene'); 
        });

        // 6. hover effect for buttons
        [level1Btn, level2Btn, backBtn].forEach(btn => {
            btn.on('pointerover', () => btn.setAlpha(0.7));
            btn.on('pointerout', () => btn.setAlpha(1));
        });
    }
}