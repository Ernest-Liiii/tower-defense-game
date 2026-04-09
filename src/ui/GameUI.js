export class GameUI extends Phaser.Scene {
    constructor() {
        super({ key: 'GameUI' });
    }

    create() {
        // 1. draw UI elements
        this.add.text(20, 20, '关卡 1：教学关卡', { fontSize: '20px', fill: '#00ff00' });
        let uiPanel = this.add.rectangle(900, 300, 200, 600, 0x2c3e50).setInteractive(); 

        this.add.text(820, 20, '控制面板', { fontSize: '24px', fill: '#ffffff', fontStyle: 'bold' });
        this.moneyText = this.add.text(820, 70, '💰 费用: 0', { fontSize: '20px', fill: '#ffd700', fontStyle: 'bold' });
        this.livesText = this.add.text(820, 100, '❤️ 生命: 0', { fontSize: '20px', fill: '#ff4757', fontStyle: 'bold' });
        this.add.rectangle(900, 140, 160, 2, 0x7f8fa6);

        let btnGold = this.add.text(820, 160, '🟡 金塔 ($50)', { fontSize: '18px', fill: '#feca57' }).setInteractive();
        let btnWater = this.add.text(820, 200, '🔵 水塔 ($50)', { fontSize: '18px', fill: '#48dbfb' }).setInteractive();
        let btnFire = this.add.text(820, 240, '🔴 火塔 ($100)', { fontSize: '18px', fill: '#ff6b6b' }).setInteractive();
        this.selectedText = this.add.text(820, 300, '👉 當前: 火塔', { fontSize: '18px', fill: '#1dd1a1', fontStyle: 'bold' });

        let pauseBtn = this.add.text(900, 550, '⏸ 暫停遊戲', { 
            fontSize: '20px', fill: '#ffffff', backgroundColor: '#34495e', padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive();

        // 2. get reference to GameScene to read initial values and send commands
        const gameScene = this.scene.get('GameScene');

        // initialize UI with GameScene data
        this.moneyText.setText('💰 費用: ' + gameScene.playerMoney);
        this.livesText.setText('❤️ 生命: ' + gameScene.playerLives);

        // 3. button interactions
        pauseBtn.on('pointerdown', () => {
            gameScene.scene.pause(); 
            this.scene.launch('PauseScene'); 
        });

        btnGold.on('pointerdown', () => { gameScene.currentSelectedTower = 'gold'; this.selectedText.setText('👉 當前: 金塔'); });
        btnWater.on('pointerdown', () => { gameScene.currentSelectedTower = 'water'; this.selectedText.setText('👉 當前: 水塔'); });
        btnFire.on('pointerdown', () => { gameScene.currentSelectedTower = 'fire'; this.selectedText.setText('👉 當前: 火塔'); });

        // 4. listen to GameScene events to update UI
        gameScene.events.on('updateMoney', (money) => this.moneyText.setText('💰 費用: ' + money));
        gameScene.events.on('updateLives', (lives) => this.livesText.setText('❤️ 生命: ' + lives));
        gameScene.events.on('gameOver', () => this.showGameOver());
    }

    showGameOver() {
        this.add.rectangle(500, 300, 1000, 600, 0x000000, 0.7);
        this.add.text(500, 250, '遊戲結束 GAME OVER', { fontSize: '48px', fill: '#ff0000', fontStyle: 'bold' }).setOrigin(0.5);
        let restartBtn = this.add.text(500, 350, '↻ 重新開始', { fontSize: '32px', fill: '#00ff00' }).setOrigin(0.5).setInteractive();

        restartBtn.on('pointerover', () => restartBtn.setStyle({ fill: '#ffff00' }));
        restartBtn.on('pointerout', () => restartBtn.setStyle({ fill: '#00ff00' }));
        restartBtn.on('pointerdown', () => {
            this.scene.stop(); // stop UI scene
            this.scene.get('GameScene').scene.restart(); // 重启主场景
        });
    }
}