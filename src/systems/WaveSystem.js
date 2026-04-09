// this file is used to set the game enemy wave system

export class WaveSystem {
    constructor(scene) {
        this.scene = scene;
        
        this.currentLevelData = null;
        this.currentWaveIndex = 0;
        this.currentWaveSpawningComplete = false;
        this.waitingForEnemyDefeat = false;
        this.activeSpawners = [];
        this.nextWaveStartTime = 0;
    }

    // initialize the wave system
    start(levelData) {
        this.currentLevelData = levelData;
        this.currentWaveIndex = 0;
        this.currentWaveSpawningComplete = false;
        this.waitingForEnemyDefeat = false;
        this.activeSpawners = [];
        
        // Set the countdown timer for the first wave
        this.nextWaveStartTime = this.scene.timeSystem.time + this.currentLevelData.waves[0].startDelay;
        console.log("WaveSystem 已啟動");

        // update the wave text in the UI
        this.scene.events.emit('updateWave', this.currentWaveIndex + 1, this.currentLevelData.waves.length);
    }

    // Call this method every frame in the GameScene's update method
    update(time) {
        // Make sure the game isn't over yet
        if (this.scene.isGameOver || this.scene.isLevelWon) return;

        if (this.currentWaveIndex < this.currentLevelData.waves.length) {
            let currentWaveConfig = this.currentLevelData.waves[this.currentWaveIndex];

            // ================= Stage 1: wait for the next stage =================
            if (this.activeSpawners.length === 0 && !this.currentWaveSpawningComplete && !this.waitingForEnemyDefeat) {
                if (time >= this.nextWaveStartTime) {
                    console.log(`第 ${this.currentWaveIndex + 1} 波開始！`);
                    currentWaveConfig.enemies.forEach(enemyConfig => {
                        let delay = enemyConfig.delay || 0;
                        this.activeSpawners.push({
                            type: enemyConfig.type,
                            amountLeft: enemyConfig.amount,
                            interval: enemyConfig.interval,
                            nextSpawnTime: time + delay
                        });
                    });
                }
            } 

            // ================= Stage 2: spawning logic =================
            else if (this.activeSpawners.length > 0) {
                for (let i = this.activeSpawners.length - 1; i >= 0; i--) {
                    let spawner = this.activeSpawners[i];
                    
                    if (spawner.amountLeft > 0 && time >= spawner.nextSpawnTime) {
                        
                        // call spawnEnemy defined in the game scene
                        this.scene.spawnEnemy(spawner.type, time);
                        
                        spawner.amountLeft--;
                        spawner.nextSpawnTime = time + spawner.interval;
                        
                        if (spawner.amountLeft <= 0) {
                            this.activeSpawners.splice(i, 1);
                        }
                    }
                }
                
                if (this.activeSpawners.length === 0) {
                    this.currentWaveSpawningComplete = true;
                    this.waitingForEnemyDefeat = true;
                    console.log(`第 ${this.currentWaveIndex + 1} 波出怪完畢，等待清場...`);
                }
            }

            // ================= Stage 3: enemy spawning is complete; wait for players to clear the area. =================
            else if (this.waitingForEnemyDefeat) {
                // read enemies array in the game scene
                if (this.scene.enemies.getLength() === 0) {
                    this.currentWaveIndex++;
                    this.currentWaveSpawningComplete = false;
                    this.waitingForEnemyDefeat = false;
                    
                    if (this.currentWaveIndex < this.currentLevelData.waves.length) {
                        let nextDelay = this.currentLevelData.waves[this.currentWaveIndex].startDelay;
                        this.nextWaveStartTime = time + nextDelay;
                        console.log(`清場成功！下一波將在 ${nextDelay/1000} 秒後到來`);

                        // update the wave text in the UI after successfully clearing the wave
                        this.scene.events.emit('updateWave', this.currentWaveIndex + 1, this.currentLevelData.waves.length);
                    }
                }
            }
        } else {
            
            // Move the tower to the GameScene's tower array once all waves have been cleared and there are no enemies left on the field
            // Win the game
            if (this.scene.enemies.getLength() === 0 && !this.scene.isGameOver && !this.scene.isLevelWon) {
                this.scene.isLevelWon = true; 
                this.scene.physics.pause();
                this.scene.tweens.pauseAll(); 

                // Emit a custom event to notify the GameUI to show the "You Win" screen
                this.scene.events.emit('levelWon');
            }
        }
    }

    forceStartNextWave() {
        // 🔒 安全锁 1：如果游戏已经结束，直接拦截，按了没反应，防止诈尸
        if (!this.scene || !this.scene.sys || !this.scene.sys.isActive()) return;
        if (this.scene.isGameOver || this.scene.isLevelWon) return;

        let currentTime = this.scene.timeSystem.time;
        let isWaitingForStart = (this.activeSpawners.length === 0 && !this.currentWaveSpawningComplete && !this.waitingForEnemyDefeat);

        if (isWaitingForStart) {
            console.log("強制跳過倒數計時！");
            this.nextWaveStartTime = currentTime;
        } else {
            let nextIndex = this.currentWaveIndex + 1;

            if (nextIndex < this.currentLevelData.waves.length) {
                console.log("場上還有怪，提前呼叫下一波！");
                
                this.currentWaveIndex = nextIndex;
                let nextWaveConfig = this.currentLevelData.waves[this.currentWaveIndex];

                nextWaveConfig.enemies.forEach(enemyConfig => {
                    let delay = enemyConfig.delay || 0;
                    this.activeSpawners.push({
                        type: enemyConfig.type,
                        amountLeft: enemyConfig.amount,
                        interval: enemyConfig.interval,
                        nextSpawnTime: currentTime + delay
                    });
                });

                this.currentWaveSpawningComplete = false;
                this.waitingForEnemyDefeat = false;

                // 🔒 安全锁 2：防止 UI 显示 4 / 3 这种越界的波次数字
                let displayWave = Math.min(this.currentWaveIndex + 1, this.currentLevelData.waves.length);
                this.scene.events.emit('updateWave', displayWave, this.currentLevelData.waves.length);

                // 奖励金币与特效
                this.scene.playerMoney += 20;
                this.scene.events.emit('updateMoney', this.scene.playerMoney);
                
                let bonusText = this.scene.add.text(880, 610, '+20$ 提前迎戰!', { 
                    fontSize: '14px', fill: '#ffd700', fontStyle: 'bold' 
                }).setOrigin(0.5);
                
                this.scene.tweens.add({
                    targets: bonusText, 
                    y: 560, 
                    alpha: 0, 
                    duration: 1500, 
                    onComplete: () => bonusText.destroy()
                });

            } else {
                console.log("已經是最後一波了，無法呼叫");
            }
        }
    }
}