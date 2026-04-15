import { TOWER_DATA } from "../config/tower_data.js";

export class GameUI extends Phaser.Scene {
    constructor() {
        super({ key: 'GameUI' });
    }

    create() {
        // 1. draw UI elements
        this.add.text(20, 20, '关卡 1：教学关卡', { fontSize: '20px', fill: '#00ff00' });
        let uiPanel = this.add.rectangle(900, 300, 200, 600, 0x2c3e50).setInteractive(); 

        this.add.text(820, 20, '控制面板', { fontSize: '24px', fill: '#ffffff', fontStyle: 'bold' });
        this.moneyText = this.add.text(820, 60, '💰 费用: 0', { fontSize: '18px', fill: '#ffd700', fontStyle: 'bold' });
        this.livesText = this.add.text(820, 90, '❤️ 生命: 0', { fontSize: '18px', fill: '#ff4757', fontStyle: 'bold' });
        this.waveText = this.add.text(820, 120, '🌊 波次: ? / ?', { fontSize: '18px', fill: '#0984e3', fontStyle: 'bold' });
        
        this.add.rectangle(900, 150, 160, 2, 0x7f8fa6);

        // ===== 【修改点 1】：新增木塔和土塔的按钮 =====
        let btnGold = this.add.text(820, 165, '🟡 金塔 ($50)', { fontSize: '18px', fill: '#feca57' }).setInteractive();
        let btnWater = this.add.text(820, 200, '🔵 水塔 ($50)', { fontSize: '18px', fill: '#48dbfb' }).setInteractive();
        let btnFire = this.add.text(820, 235, '🔴 火塔 ($100)', { fontSize: '18px', fill: '#ff6b6b' }).setInteractive();
        let btnWood = this.add.text(820, 270, '🟢 木塔 ($75)', { fontSize: '18px', fill: '#2ecc71' }).setInteractive();
        let btnEarth = this.add.text(820, 305, '🟤 土塔 ($120)', { fontSize: '18px', fill: '#e67e22' }).setInteractive();
        
        // 【修改点 2】：把下面的信息栏整体往下移动
        this.selectedText = this.add.text(820, 345, '👉 當前: 火塔', { fontSize: '18px', fill: '#1dd1a1', fontStyle: 'bold' });
        this.add.rectangle(900, 380, 160, 2, 0x7f8fa6); // 分隔线
        this.add.text(820, 390, '塔楼详细信息', { fontSize: '18px', fill: '#ffffff', fontStyle: 'bold' });

        this.towerInfoText = this.add.text(820, 420, TOWER_DATA.fire.description, { 
            fontSize: '14px', fill: '#ffffff', wordWrap: { width: 160, useAdvancedWrap: true }
        });

        // 底部按钮保持不变
        let pauseBtn = this.add.text(900, 550, '⏸ 暫停遊戲', { fontSize: '20px', fill: '#ffffff', backgroundColor: '#34495e', padding: { x: 10, y: 5 } }).setOrigin(0.5).setInteractive();
        let speedBtn = this.add.text(840, 570, 'x2', { fontSize: '16px', fill: '#fff', backgroundColor: '#e17055', padding: {x:5, y:5} }).setInteractive();
        let nextWaveBtn = this.add.text(880, 570, '⏭ 迎战', { fontSize: '16px', fill: '#fff', backgroundColor: '#d63031', padding: {x:5, y:5} }).setInteractive();

        const gameScene = this.scene.get('GameScene');

        this.moneyText.setText('💰 費用: ' + gameScene.playerMoney);
        this.livesText.setText('❤️ 生命: ' + gameScene.playerLives);

        if (gameScene.waveSystem && gameScene.waveSystem.currentLevelData) {
            let currentWave = gameScene.waveSystem.currentWaveIndex + 1;
            let totalWaves = gameScene.waveSystem.currentLevelData.waves.length;
            this.waveText.setText(`🌊 波次: ${currentWave} / ${totalWaves}`);
        }

        // ===== 【修改点 3】：绑定所有塔的点击事件 =====
        pauseBtn.on('pointerdown', () => { gameScene.scene.pause(); this.scene.launch('PauseScene'); });
        
        const selectTower = (type, name, data) => {
            gameScene.currentSelectedTower = type;
            this.selectedText.setText(`👉 當前: ${name}`);
            this.towerInfoText.setText(data.description);
        };

        btnGold.on('pointerdown', () => selectTower('gold', '金塔', TOWER_DATA.gold));
        btnWater.on('pointerdown', () => selectTower('water', '水塔', TOWER_DATA.water));
        btnFire.on('pointerdown', () => selectTower('fire', '火塔', TOWER_DATA.fire));
        btnWood.on('pointerdown', () => selectTower('wood', '木塔', TOWER_DATA.wood));
        btnEarth.on('pointerdown', () => selectTower('earth', '土塔', TOWER_DATA.earth));

        let isFastForward = false;
        speedBtn.on('pointerdown', () => {
            isFastForward = !isFastForward;
            gameScene.timeSystem.setTimeScale(isFastForward ? 2.0 : 1.0);
            speedBtn.setText(isFastForward ? 'x1' : 'x2');
            speedBtn.setStyle({ backgroundColor: isFastForward ? '#00b894' : '#e17055' });
        });

        nextWaveBtn.on('pointerdown', () => gameScene.events.emit('forceNextWave'));

        gameScene.events.off('updateMoney'); gameScene.events.off('updateLives'); gameScene.events.off('updateWave'); gameScene.events.off('gameOver'); gameScene.events.off('levelWon');
        gameScene.events.on('updateMoney', (money) => this.moneyText.setText('💰 費用: ' + money));
        gameScene.events.on('updateLives', (lives) => this.livesText.setText('❤️ 生命: ' + lives));
        gameScene.events.on('updateWave', (current, total) => this.waveText.setText(`🌊 波次: ${current} / ${total}`));
        gameScene.events.on('gameOver', () => this.showGameOver());
        gameScene.events.on('levelWon', () => this.showVictory());
    }

    showGameOver() {
        this.add.rectangle(500, 300, 1000, 600, 0x000000, 0.7);
        this.add.text(500, 250, '遊戲結束 GAME OVER', { fontSize: '48px', fill: '#ff0000', fontStyle: 'bold' }).setOrigin(0.5);
        let restartBtn = this.add.text(500, 350, '↻ 重新開始', { fontSize: '32px', fill: '#00ff00' }).setOrigin(0.5).setInteractive();

        restartBtn.on('pointerover', () => restartBtn.setStyle({ fill: '#ffff00' }));
        restartBtn.on('pointerout', () => restartBtn.setStyle({ fill: '#00ff00' }));
        restartBtn.on('pointerdown', () => {
            let gs = this.scene.get('GameScene');
            let currentLevel = gs.currentLevelKey || 'level1';
            
            this.scene.stop(); // stop UI scene

            gs.scene.restart({ levelKey: currentLevel }); // restart GameScene
        });
    }

    showVictory() {
        let overlay = this.add.rectangle(500, 300, 1000, 600, 0x000000, 0.3);

        overlay.setInteractive();
        overlay.setDepth(100);

        let winText = this.add.text(500, 200, '關卡勝利！ YOU WIN!', { 
            fontSize: '48px', fill: '#00ff00', fontStyle: 'bold' 
        }).setOrigin(0.5);
        winText.setDepth(101);

        let homeBtn = this.add.text(500, 350, '🏠 返回首頁', { 
            fontSize: '32px', fill: '#ffaa00' 
        }).setOrigin(0.5).setInteractive();
        homeBtn.setDepth(101);

        homeBtn.on('pointerover', () => homeBtn.setStyle({ fill: '#ffff00' }));
        homeBtn.on('pointerout', () => homeBtn.setStyle({ fill: '#ffaa00' }));
        homeBtn.on('pointerdown', () => {

            this.scene.stop('GameScene'); // close the game scene
            this.scene.stop();            // close the UI scene
            this.scene.start('StartScene'); // return to the start scene
        });
    }
}