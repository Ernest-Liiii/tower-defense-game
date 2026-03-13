// this is a file to store the start scene of the game,
// which is the first scene that players will see when they launch the game

export class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' }); // name setting for this scene
    }

    create() {
        // background color setting
        this.cameras.main.setBackgroundColor('#2c3e50');

        // game tile text
        this.add.text(400, 200, 'Elemental Tower Defense Game', { 
            fontSize: '48px', 
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // start button
        let startBtn = this.add.text(400, 350, '▶ Click to Start', { 
            fontSize: '32px', 
            fill: '#00ff00' 
        }).setOrigin(0.5).setInteractive();

        // mouse hover effect setting
        startBtn.on('pointerover', () => startBtn.setStyle({ fill: '#ffff00' }));
        startBtn.on('pointerout', () => startBtn.setStyle({ fill: '#00ff00' }));

        // click event to transition to the next scene (for now, we directly go to the game scene)
        // later we will add the level selection scene, so we will transition to that scene instead
        startBtn.on('pointerdown', () => {
            this.scene.start('GameScene'); // switch to GameScene
        });
    }
}