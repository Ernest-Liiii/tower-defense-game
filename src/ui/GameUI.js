import { TOWER_DATA } from "../config/tower_data.js";

export class GameUI extends Phaser.Scene {
    constructor() {
        super({ key: 'GameUI' });
    }

    create() {
        // 1. Draw UI elements
        this.add.text(20, 20, 'Level 1: Tutorial Level', { fontSize: '20px', fill: '#00ff00' });
        let uiPanel = this.add.rectangle(900, 300, 200, 600, 0x2c3e50).setInteractive(); 

        this.add.text(820, 20, 'Control Panel', { fontSize: '20px', fill: '#ffffff', fontStyle: 'bold' });
        this.moneyText = this.add.text(820, 60, '💰 Money: 0', { fontSize: '18px', fill: '#ffd700', fontStyle: 'bold' });
        this.livesText = this.add.text(820, 90, '❤️ Lives: 0', { fontSize: '18px', fill: '#ff4757', fontStyle: 'bold' });
        this.waveText = this.add.text(820, 120, '🌊 Wave: ? / ?', { fontSize: '18px', fill: '#0984e3', fontStyle: 'bold' });
        
        this.add.rectangle(900, 150, 160, 2, 0x7f8fa6);

        // ===== Modification 1: Added buttons for Wood and Earth towers =====
        let btnGold = this.add.text(820, 165, '🟡 Gold($50)', { fontSize: '18px', fill: '#feca57' }).setInteractive();
        let btnWater = this.add.text(820, 200, '🔵 Water($50)', { fontSize: '18px', fill: '#48dbfb' }).setInteractive();
        let btnFire = this.add.text(820, 235, '🔴 Fire($100)', { fontSize: '18px', fill: '#ff6b6b' }).setInteractive();
        let btnWood = this.add.text(820, 270, '🟢 Wood($75)', { fontSize: '18px', fill: '#2ecc71' }).setInteractive();
        let btnEarth = this.add.text(820, 305, '🟤 Earth($120)', { fontSize: '18px', fill: '#e67e22' }).setInteractive();
        
        // ===== Modification 2: Moved information panel down =====
        this.selectedText = this.add.text(820, 345, '👉 Current: Fire', { fontSize: '18px', fill: '#1dd1a1', fontStyle: 'bold' });
        this.add.rectangle(900, 380, 160, 2, 0x7f8fa6); // Divider line
        this.add.text(820, 390, 'Tower Details', { fontSize: '18px', fill: '#ffffff', fontStyle: 'bold' });

        this.towerInfoText = this.add.text(820, 420, TOWER_DATA.fire.description, { 
            fontSize: '14px', fill: '#ffffff', wordWrap: { width: 160, useAdvancedWrap: true }
        });

        // Bottom buttons unchanged
        let pauseBtn = this.add.text(900, 550, '⏸ Pause Game', { fontSize: '20px', fill: '#ffffff', backgroundColor: '#34495e', padding: { x: 10, y: 5 } }).setOrigin(0.5).setInteractive();
        let speedBtn = this.add.text(820, 570, 'x2', { fontSize: '16px', fill: '#fff', backgroundColor: '#e17055', padding: {x:5, y:5} }).setInteractive();
        let nextWaveBtn = this.add.text(860, 570, '⏭ Next Wave', { fontSize: '16px', fill: '#fff', backgroundColor: '#d63031', padding: {x:5, y:5} }).setInteractive();

        const gameScene = this.scene.get('GameScene');

        this.moneyText.setText('💰 Money: ' + gameScene.playerMoney);
        this.livesText.setText('❤️ Lives: ' + gameScene.playerLives);

        if (gameScene.waveSystem && gameScene.waveSystem.currentLevelData) {
            let currentWave = gameScene.waveSystem.currentWaveIndex + 1;
            let totalWaves = gameScene.waveSystem.currentLevelData.waves.length;
            this.waveText.setText(`🌊 Wave: ${currentWave} / ${totalWaves}`);
        }

        // ===== Modification 3: Bind tower selection events =====
        pauseBtn.on('pointerdown', () => { gameScene.scene.pause(); this.scene.launch('PauseScene'); });
        
        const selectTower = (type, name, data) => {
            gameScene.currentSelectedTower = type;
            this.selectedText.setText(`👉 Current: ${name}`);
            this.towerInfoText.setText(data.description);
        };

        btnGold.on('pointerdown', () => selectTower('gold', 'Gold Tower', TOWER_DATA.gold));
        btnWater.on('pointerdown', () => selectTower('water', 'Water Tower', TOWER_DATA.water));
        btnFire.on('pointerdown', () => selectTower('fire', 'Fire Tower', TOWER_DATA.fire));
        btnWood.on('pointerdown', () => selectTower('wood', 'Wood Tower', TOWER_DATA.wood));
        btnEarth.on('pointerdown', () => selectTower('earth', 'Earth Tower', TOWER_DATA.earth));

        let isFastForward = false;
        speedBtn.on('pointerdown', () => {
            isFastForward = !isFastForward;
            gameScene.timeSystem.setTimeScale(isFastForward ? 2.0 : 1.0);
            speedBtn.setText(isFastForward ? 'x1' : 'x2');
            speedBtn.setStyle({ backgroundColor: isFastForward ? '#00b894' : '#e17055' });
        });

        nextWaveBtn.on('pointerdown', () => gameScene.events.emit('forceNextWave'));

        gameScene.events.off('updateMoney'); gameScene.events.off('updateLives'); gameScene.events.off('updateWave'); gameScene.events.off('gameOver'); gameScene.events.off('levelWon');
        gameScene.events.on('updateMoney', (money) => this.moneyText.setText('💰 Money: ' + money));
        gameScene.events.on('updateLives', (lives) => this.livesText.setText('❤️ Lives: ' + lives));
        gameScene.events.on('updateWave', (current, total) => this.waveText.setText(`🌊 Wave: ${current} / ${total}`));
        gameScene.events.on('gameOver', () => this.showGameOver());
        gameScene.events.on('levelWon', () => this.showVictory());
    }

    showGameOver() {
        this.add.rectangle(500, 300, 1000, 600, 0x000000, 0.7);
        this.add.text(500, 250, 'GAME OVER', { fontSize: '48px', fill: '#ff0000', fontStyle: 'bold' }).setOrigin(0.5);
        let restartBtn = this.add.text(500, 350, '↻ Restart', { fontSize: '32px', fill: '#00ff00' }).setOrigin(0.5).setInteractive();

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

        let winText = this.add.text(500, 200, 'YOU WIN!', { 
            fontSize: '48px', fill: '#00ff00', fontStyle: 'bold' 
        }).setOrigin(0.5);
        winText.setDepth(101);

        let homeBtn = this.add.text(500, 350, 'back to menu', { 
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