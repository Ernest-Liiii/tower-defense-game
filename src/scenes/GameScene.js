// this file is used to control the main game scene, 
// including loading assets, creating game objects, and handling game logic

// import nessary helper functions
import { getEnemyInRange, drawDirectionalRange } from '../utils/towerHelpers.js';
import { shoot, hitEnemy } from '../utils/combatHelpers.js';

// import the system used in this game
import { WaveSystem } from '../systems/WaveSystem.js';
import { BuildingSystem } from '../systems/BuildingSystem.js';
import { PathSystem } from '../systems/PathSystem.js';

// import the data for levels and towers
import { LEVEL_DATA } from '../config/level_data.js';
import { TOWER_DATA } from '../config/tower_data.js';
import { ENEMY_DATA } from '../config/enemy_data.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    // 當場景每次啟動 (或重新開始) 時，都會先執行這裡
    init() {
        this.playerMoney = LEVEL_DATA.level1.initialMoney; // 重置金幣
        this.playerLives = LEVEL_DATA.level1.initialLives;  // 重置生命值
        this.towers = [];        // 清空防禦塔陣列
        this.nextEnemy = 0;      // 重置生怪計時器
        this.isGameOver = false; // 解除遊戲結束狀態
        
        this.currentSelectedTower = 'fire'; // 默認選中火塔
        
        this.waveSystem = new WaveSystem(this); 
        this.waveSystem.start(LEVEL_DATA.level1);

        this.pathSystem = new PathSystem(this);
        this.pathSystem.init(LEVEL_DATA.level1);
    }

    // 【新增】預載入遊戲素材
    preload() {
        // 第一個參數是你給這張圖片取的「代號」，第二個參數是圖片的「相對路徑」
        // 請確保路徑和大小寫完全對應你的資料夾結構！
        this.load.image('grass', 'assets/images/Grass.png');
        this.load.image('dirt', 'assets/images/Dirt.png');

        // load the textures of the towers
        this.load.image('water_tower', 'assets/images/WaterTower.png')
        this.load.image('gold_tower', 'assets/images/GoldTower.png')
        this.load.image('fire_tower', 'assets/images/FireTower.png')
    }

    create() {
        // 定義網格單元格大小
        this.cellSize = 40;
        // 這裡放你原本 game.js 裡 create() 函數中的所有程式碼！
        // 包含建立網格、UI、註冊拖拽事件等
        this.add.text(20, 20, '关卡 1：教学关卡', { fontSize: '20px', fill: '#00ff00' });
    
        // ================= 1. 右側專屬 UI 面板 =================
        
        // 畫一個深灰色的矩形作為右側底板 (X: 900, Y: 300, 寬: 200, 高: 600)
        let uiPanel = this.add.rectangle(900, 300, 200, 600, 0x2c3e50);
        // 【超級重要】將這塊底板設為可互動，它就會像一面完美的盾牌，擋下所有點擊，你再也不用擔心誤觸網格了！
        uiPanel.setInteractive(); 

        // 面板標題
        this.add.text(820, 20, '控制面板', { fontSize: '24px', fill: '#ffffff', fontStyle: 'bold' });

        // 狀態資訊 (X 座標統一移到 820)
        this.moneyText = this.add.text(820, 70, '💰 費用: ' + this.playerMoney, { fontSize: '20px', fill: '#ffd700', fontStyle: 'bold' });
        this.livesText = this.add.text(820, 100, '❤️ 生命: ' + this.playerLives, { fontSize: '20px', fill: '#ff4757', fontStyle: 'bold' });

        // 分隔線
        this.add.rectangle(900, 140, 160, 2, 0x7f8fa6);

        // 建造按鈕 (往下排)
        let btnGold = this.add.text(820, 160, '🟡 金塔 ($50)', { fontSize: '18px', fill: '#feca57' }).setInteractive();
        let btnWater = this.add.text(820, 200, '🔵 水塔 ($50)', { fontSize: '18px', fill: '#48dbfb' }).setInteractive();
        let btnFire = this.add.text(820, 240, '🔴 火塔 ($100)', { fontSize: '18px', fill: '#ff6b6b' }).setInteractive();

        // 顯示當前選中的塔
        this.selectedText = this.add.text(820, 300, '👉 當前: 火塔', { fontSize: '18px', fill: '#1dd1a1', fontStyle: 'bold' });

        // 暫停按鈕 (放在右下角)
        let pauseBtn = this.add.text(900, 550, '⏸ 暫停遊戲', { 
            fontSize: '20px', fill: '#ffffff', backgroundColor: '#34495e', padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive();

        // --- 以下保留你原本的點擊事件邏輯 ---
        pauseBtn.on('pointerdown', () => {
            this.scene.pause(); 
            this.scene.launch('PauseScene'); 
        });

        // 保存當前場景實例的引用，用於事件回調
        const scene = this;
        btnGold.on('pointerdown', () => { 
            scene.currentSelectedTower = 'gold'; 
            scene.selectedText.setText('👉 當前: 金塔'); 
        });
        btnWater.on('pointerdown', () => { 
            scene.currentSelectedTower = 'water'; 
            scene.selectedText.setText('👉 當前: 水塔'); 
        });
        btnFire.on('pointerdown', () => { 
            scene.currentSelectedTower = 'fire'; 
            scene.selectedText.setText('👉 當前: 火塔'); 
        });

        // ================= 3. 画网格和高亮路径 =================
        // this.add.grid(400, 300, 800, 600, cellSize, cellSize, 0x000000, 0, 0xffffff, 0.2);

        // this.path = this.add.path(0, 100);
        // this.path.lineTo(580, 100);
        // this.path.lineTo(580, 380);
        // this.path.lineTo(220, 380);
        // this.path.lineTo(220, 600);
        
        // const graphics = this.add.graphics();
        // graphics.lineStyle(2, 0xffffff, 0.5);
        // this.path.draw(graphics);

        // const pathGraphics = this.add.graphics();
        // pathGraphics.fillStyle(0xffffff, 0.15); 
        
        if (this.pathSystem.currentFullPath.length > 0) {
            let startPoint = this.pathSystem.currentFullPath[0];
            this.path = this.add.path(startPoint.x, startPoint.y);
            
            for (let i = 1; i < this.pathSystem.currentFullPath.length; i++) {
                let p = this.pathSystem.currentFullPath[i];
                this.path.lineTo(p.x, p.y);
            }
        }

        // 2. 動態鋪設草地與泥土
        for (let x = 0; x < 800; x += this.cellSize) {
            for (let y = 0; y < 600; y += this.cellSize) {
                let cx = x + 20; 
                let cy = y + 20; 
                
                // 檢查這個格子的中心點，有沒有在我們動態計算出的路徑陣列裡？
                let isPath = this.pathSystem.currentFullPath.some(p => p.x === cx && p.y === cy);

                if (isPath) {
                    let dirtTile = this.add.image(cx, cy, 'dirt');
                    dirtTile.setDisplaySize(this.cellSize, this.cellSize); 
                } else {
                    let grassTile = this.add.image(cx, cy, 'grass');
                    grassTile.setDisplaySize(this.cellSize, this.cellSize);
                }
            }
        }

        const texGraphics = this.add.graphics();
        texGraphics.fillStyle(0xff0000);
        texGraphics.fillCircle(10, 10, 10);
        texGraphics.generateTexture('enemyTexture', 20, 20);
        texGraphics.clear();

        texGraphics.fillStyle(0xffff00);
        texGraphics.fillCircle(4, 4, 4);
        texGraphics.generateTexture('bulletTexture', 8, 8);
        texGraphics.clear();

        // ================= 沸水弹贴图 =================
        texGraphics.fillStyle(0xff8c00); // 橙红色
        texGraphics.fillCircle(6, 6, 6); // 沸水弹稍微画大一点点 (半径6)
        texGraphics.generateTexture('boilingBulletTexture', 12, 12);
        texGraphics.clear();

        this.enemies = this.physics.add.group(); // 初始化敌人组
        this.bullets = this.physics.add.group(); // 初始化子弹组

        // 重新绑定碰撞检测
        this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => {
            // 注意：这里需要传入当前场景的引用
            const moneyData = { value: this.playerMoney };
            hitEnemy(this, bullet, enemy, moneyData, this.moneyText);

            // update the moneyData in the GameScene
            this.playerMoney = moneyData.value;
        }, null, this);

        // ================= 4. 全新拖拽建造逻辑 =================

        this.buildingSystem = new BuildingSystem(this);
        this.buildingSystem.setupInputListeners();
    }

    update(time, delta) {
        // 這裡放你原本 game.js 裡 update() 函數中的所有程式碼！
        // 包含生成敵人、塔的攻擊邏輯等
        if (this.isGameOver) return; // 如果游戏结束了，就不执行后续的更新逻辑
        
        this.waveSystem.update(time);

        // 2. 防御塔工作逻辑 (包含攻击与产费)
        this.towers.forEach(tower => {
            
            // ================= 火塔：攻击逻辑 =================
            // 只有攻击范围大于0的塔（火塔）才会索敌开火
            if (tower.type === 'fire') {
                if (time > tower.nextFire) {
                    let target = getEnemyInRange(tower, this.enemies.getChildren()); // 注意：需要传入敌人数组
                    if (target) {
                        // 【新增：元素联动检测】看看自己是不是在水塔范围内
                        let isBuffed = false;
                        this.towers.forEach(otherTower => {
                            // 找到场上存活的水塔
                            if (otherTower.type === 'water' && otherTower.active) {
                                let dx = Math.abs(tower.x - otherTower.x);
                                let dy = Math.abs(tower.y - otherTower.y);
                                // 水塔范围是 5x5 (即中心向外各 100 像素)
                                if (dx <= 100 && dy <= 100) {
                                    isBuffed = true; // 吃到强化了！
                                }
                            }
                        });

                        // 发射子弹，并把强化状态传过去
                        shoot(this, tower, target, this.bullets, isBuffed);
                        tower.nextFire = time + 500;
                    }
                }
            }

            // ================= 金塔：产费逻辑 =================
            if (tower.type === 'gold') {
                // 如果当前时间超过了下次产费时间
                if (time > tower.nextGoldTime) {
                    
                    // 1. 增加玩家金币并更新右上角UI
                    this.playerMoney += 5; // 每次产费增加5金币
                    this.moneyText.setText('💰 費用: ' + this.playerMoney);
                    
                    // 2. 做一个酷炫的飘字特效，告诉玩家“加钱了！”
                    let floatText = this.add.text(tower.x - 10, tower.y - 20, '+5$', { 
                        fontSize: '18px', fill: '#ffd700', fontStyle: 'bold' 
                    });
                    // 使用 Phaser 的补间动画 (Tween) 让文字向上飘并渐渐变透明
                    this.tweens.add({
                        targets: floatText,
                        y: tower.y - 50, // 往上飘 30 像素
                        alpha: 0,        // 透明度变成 0
                        duration: 1000,  // 动画持续 1 秒
                        onComplete: () => floatText.destroy() // 动画结束后销毁文字，节省内存
                    });

                    // 3. 设定下一次产费的时间 (当前时间 + 2000毫秒)
                    tower.nextGoldTime = time + 2000; 
                }
            }

            // ================= 水塔：群体治疗逻辑 =================
            if (tower.type === 'water') {
                // 每 1000 毫秒（1秒）触发一次
                if (time > tower.nextHealTime) {
                    
                    // 遍历所有的塔，看看谁在我的 5x5 水域内
                    this.towers.forEach(targetTower => {
                        // 计算两个塔在 X 轴和 Y 轴的像素距离
                        let dx = Math.abs(targetTower.x - tower.x);
                        let dy = Math.abs(targetTower.y - tower.y);
                        
                        // 如果 X 和 Y 距离都在 100 以内，说明在这个 200x200 的正方形范围内
                        if (dx <= 100 && dy <= 100) {
                            
                            // 执行治疗，但不能超过最大生命值
                            if (targetTower.hp < targetTower.maxHp) {
                                targetTower.hp = Math.min(targetTower.hp + 25, targetTower.maxHp);
                            }

                            // 为了让你看清效果，不管满没满血，我们都飘个绿字
                            let healText = this.add.text(targetTower.x + 5, targetTower.y - 15, '+25 HP', {
                                fontSize: '14px', fill: '#00ff00', fontStyle: 'bold'
                            });
                            this.tweens.add({
                                targets: healText,
                                y: targetTower.y - 35,
                                alpha: 0,
                                duration: 1000,
                                onComplete: () => healText.destroy()
                            });
                        }
                    });

                    tower.nextHealTime = time + 1000; 
                }
            }

            // ================= 【新增】敌人攻击防御塔逻辑 =================
            this.enemies.getChildren().forEach(enemy => {
                // 如果敌人还活着，并且攻击冷却好了 (2000毫秒/2秒 攻击一次)
                if (enemy.active && time > enemy.nextAttack) {
                    
                    let targetTower = null;
                    let minDistance = enemy.attackRange; // 攻击范围 40
                    
                    // 遍历所有存活的塔，看看有没有在敌人嘴边的
                    this.towers.forEach(towerItem => {
                        if (towerItem.active) {
                            let distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, towerItem.x, towerItem.y);
                            if (distance <= minDistance) {
                                targetTower = towerItem;
                                minDistance = distance;
                            }
                        }
                    });

                    // 如果身边有塔，就咬它一口！
                    if (targetTower) {
                        targetTower.hp -= enemy.damage;
                        
                        // 飘红字显示塔掉血了
                        let dmgText = this.add.text(targetTower.x, targetTower.y, '-' + enemy.damage, { fill: '#ff0000', fontStyle: 'bold' });
                        this.tweens.add({ targets: dmgText, y: targetTower.y - 30, alpha: 0, duration: 800, onComplete: () => dmgText.destroy() });
                        
                        // 如果塔的血量归零，塔就被拆毁了！
                        if (targetTower.hp <= 0) {
                            targetTower.destroy(); // 销毁塔的图像
                            targetTower.active = false; 
                        }
                        
                        // 重置敌人的攻击冷却时间 (当前时间 + 2秒)
                        enemy.nextAttack = time + 2000; 
                    }
                }
            });
            
            // 【清理无效的塔】把已经被拆掉的塔从我们的管理数组里踢出去，防止报错
            this.towers = this.towers.filter(t => t.active);
        });

        // ================= 3. 子弹追踪逻辑 =================
        this.bullets.getChildren().forEach(bullet => {
            if (bullet.active) {
                // 如果目标存在且还活着
                if (bullet.target && bullet.target.active) {
                    // 持续修正子弹飞行方向，实现“跟踪”效果
                    this.physics.moveToObject(bullet, bullet.target, 400);
                } else {
                    // 目标如果已经死了，子弹就在空中直接销毁
                    bullet.destroy();
                }
            }
        });
    }
    
    spawnEnemy(enemyType, currentTime) {
        // 1. 從 enemy_data.js 中獲取這個敵人的配置資料
        const config = ENEMY_DATA[enemyType];
        if (!config) { 
            console.warn(`找不到敵人設定：${enemyType}`); 
            return; 
        }

        // 2. 建立敵人實體並加入群組 (動態讀取起點座標)
        let startX = this.pathSystem.currentFullPath[0].x;
        let startY = this.pathSystem.currentFullPath[0].y;
        let enemy = this.add.follower(this.path, startX, startY, 'enemyTexture');
        this.enemies.add(enemy);
        
        // 3. 套用設定檔裡的數值
        enemy.hp = config.hp; 
        enemy.maxHp = config.hp;
        enemy.damage = config.damage;
        enemy.attackRange = 40; 
        enemy.nextAttack = 0;   
        enemy.spawnTime = currentTime; 

        // 4. 計算走完路徑所需的時間 (時間 = 距離 / 速度)
        // 假設路徑總長度約為 1440 像素，乘以 1000 轉換為毫秒
        const pathLength = 1440; 
        const duration = (pathLength / config.speed) * 1000;

        // 5. 開始沿著路徑移動
        enemy.startFollow({
            duration: duration, 
            rotateToPath: false,
            onComplete: () => {
                // 敵人走到終點，扣玩家血量
                if (enemy && enemy.active) {
                    enemy.destroy(); 
                    
                    this.playerLives -= 1; 
                    this.livesText.setText('❤️ 生命: ' + this.playerLives); 
                    
                    // 扣血飄字特效
                    let dmgText = this.add.text(enemy.x, enemy.y - 20, '-1 生命', { fill: '#ff0000', fontStyle: 'bold' });
                    this.tweens.add({ targets: dmgText, y: enemy.y - 50, alpha: 0, duration: 1000, onComplete: () => dmgText.destroy() });

                    // 遊戲結束判定
                    if (this.playerLives <= 0 && !this.isGameOver) {
                        this.isGameOver = true;    
                        this.physics.pause(); 
                        this.tweens.pauseAll(); 
                        
                        // 顯示 Game Over 畫面
                        this.add.rectangle(500, 300, 1000, 600, 0x000000, 0.7);
                        this.add.text(500, 250, '遊戲結束 GAME OVER', { fontSize: '48px', fill: '#ff0000', fontStyle: 'bold' }).setOrigin(0.5);
                        
                        // 重新開始按鈕
                        let restartBtn = this.add.text(500, 350, '↻ 重新開始', { 
                            fontSize: '32px', fill: '#00ff00' 
                        }).setOrigin(0.5).setInteractive();

                        restartBtn.on('pointerover', () => restartBtn.setStyle({ fill: '#ffff00' }));
                        restartBtn.on('pointerout', () => restartBtn.setStyle({ fill: '#00ff00' }));
                        restartBtn.on('pointerdown', () => {
                            this.scene.restart(); 
                        });
                    }
                }
            }
        });
    }

    updatePhaserPath() {
        // 如果目前有計算出路徑
        if (this.pathSystem.currentFullPath.length > 0) {
            let startPoint = this.pathSystem.currentFullPath[0];
            
            // 重新建立一個全新的 Phaser Path 物件
            this.path = this.add.path(startPoint.x, startPoint.y);
            
            for (let i = 1; i < this.pathSystem.currentFullPath.length; i++) {
                let p = this.pathSystem.currentFullPath[i];
                this.path.lineTo(p.x, p.y);
            }
        }
    }

    // 原本寫在全域的輔助函數 (例如 getEnemyInRange, shoot) 
    // 可以變成這個 Class 裡面的方法 (Method)，或者保留在外面當全域函數也可以。
}