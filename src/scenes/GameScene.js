// this file is used to control the main game scene, 
// including loading assets, creating game objects, and handling game logic

// import nessary helper functions
import { getEnemyInRange, drawDirectionalRange } from '../utils/towerHelpers.js';
import { shoot, hitEnemy } from '../utils/combatHelpers.js';

// import the system used in this game
import { WaveSystem } from '../systems/WaveSystem.js';
import { BuildingSystem } from '../systems/BuildingSystem.js';
import { PathSystem } from '../systems/PathSystem.js';
import { TimeSystem } from '../systems/TimeSystem.js';
import { EnemyAttackSystem } from '../systems/EnemyAttackSystem.js';

// import the data for levels and towers
import { LEVEL_DATA } from '../config/level_data.js';
import { TOWER_DATA } from '../config/tower_data.js';
import { ENEMY_DATA } from '../config/enemy_data.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    // 當場景每次啟動 (或重新開始) 時，都會先執行這裡
    init(data) {
        this.events.off('updateMoney');
        this.events.off('updateLives');
        this.events.off('updateWave');
        this.events.off('gameOver');
        this.events.off('levelWon');
        this.events.off('forceNextWave');

        // check if there's a levelKey passed in from the StartScene, if not default to 'level1'
        this.currentLevelKey = (data && data.levelKey) ? data.levelKey : 'level1';
        // dynamically load the level data based on the currentLevelKey
        const currentLevelData = LEVEL_DATA[this.currentLevelKey];

        this.playerMoney = currentLevelData.initialMoney; // 重置金幣
        this.playerLives = currentLevelData.initialLives;  // 重置生命值
        this.towers = [];        // 清空防禦塔陣列
        this.nextEnemy = 0;      // 重置生怪計時器

        this.isGameOver = false; // 解除遊戲結束狀態
        this.isLevelWon = false; // 解除關卡勝利狀態
        
        this.currentSelectedTower = 'fire'; // 默認選中火塔

        // initialize the time systems
        this.timeSystem = new TimeSystem(this)
        
        // initialize the wave system
        this.waveSystem = new WaveSystem(this); 
        this.waveSystem.start(currentLevelData);

        // initialize the path system
        this.pathSystem = new PathSystem(this);
        this.pathSystem.init(currentLevelData);

        // initialize the enemy attack system
        this.enemyAttackSystem = new EnemyAttackSystem(this);
    }

    // 【新增】預載入遊戲素材
    preload() {
        // 第一個參數是你給這張圖片取的「代號」，第二個參數是圖片的「相對路徑」
        // 請確保路徑和大小寫完全對應你的資料夾結構！
        this.load.image('grass', 'assets/images/Grass.png');
        this.load.image('dirt', 'assets/images/Dirt.png');
        this.load.image('grass1', 'assets/images/Grass1.png');
        this.load.image('dirt1', 'assets/images/Dirt1.png');

        // load the textures for the path points (start, turn, end)
        this.load.image('start_point', 'assets/images/StartPoint.png');
        this.load.image('turn_point', 'assets/images/TurnPoint.png');
        this.load.image('end_point', 'assets/images/EndPoint.png');

        // load the textures of the enemies
        this.load.image('slime', 'assets/images/Slime.png');
        this.load.image('ranged_goblin', 'assets/images/RangedGoblin.png');

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

        this.scene.launch('GameUI');  // launch the UI scene

        this.add.text(20, 20, '关卡 1：教学关卡', { fontSize: '20px', fill: '#00ff00' });
        
        if (this.pathSystem.currentFullPath.length > 0) {
            let startPoint = this.pathSystem.currentFullPath[0];
            this.path = this.add.path(startPoint.x, startPoint.y);
            
            for (let i = 1; i < this.pathSystem.currentFullPath.length; i++) {
                let p = this.pathSystem.currentFullPath[i];
                this.path.lineTo(p.x, p.y);
            }
        }

        this.mapTiles = []; // initailize the array to hold our tile sprites

        // 2. 動態鋪設草地與泥土
        for (let x = 0; x < 800; x += this.cellSize) {
            for (let y = 0; y < 600; y += this.cellSize) {
                let cx = x + 20; 
                let cy = y + 20; 
                
                // 檢查這個格子的中心點，有沒有在我們動態計算出的路徑陣列裡？
                let isPath = this.pathSystem.currentFullPath.some(p => p.x === cx && p.y === cy);

                let isVariant = Math.random() < 0.15;

                let baseKey = isPath ? 'dirt' : 'grass';
                let textureKey = isVariant ? baseKey + '1' : baseKey;

                let tile = this.add.image(cx, cy, textureKey);
                tile.setDisplaySize(this.cellSize, this.cellSize);

                // store the tile sprite
                // and its coordinates for future adjustments wheb 
                this.mapTiles.push({
                    image: tile,
                    cx: cx,
                    cy: cy,
                    isVariant: isVariant
                });
            }
        }

        this.pathSystem.waypoints.forEach((wp, index) => {
            // 将网格坐标转换为像素坐标
            let cx = wp.col * this.cellSize + this.cellSize / 2;
            let cy = wp.row * this.cellSize + this.cellSize / 2;
            
            let textureKey = 'turn_point'; // 默认为中间的转折点/补给点
            
            if (index === 0) {
                textureKey = 'start_point'; // 第一个是起点
            } else if (index === this.pathSystem.waypoints.length - 1) {
                textureKey = 'end_point';   // 最后一个是终点
            }

            // 在对应位置添加图片
            let pointImage = this.add.image(cx, cy, textureKey);
            pointImage.setDisplaySize(this.cellSize, this.cellSize);
            
            // 设置层级为 1，确保它们显示在草地/泥土(层级0)的上方，
            // 但又在塔和怪物(默认更高层级)的下方
            pointImage.setDepth(1); 
        });

        if (!this.textures.exists('enemyTexture')) {
            const texGraphics = this.make.graphics({ x: 0, y: 0, add: false });
            
            texGraphics.fillStyle(0xff0000);
            texGraphics.fillCircle(10, 10, 10);
            texGraphics.generateTexture('enemyTexture', 20, 20);
            texGraphics.clear();

            texGraphics.fillStyle(0xffff00);
            texGraphics.fillCircle(4, 4, 4);
            texGraphics.generateTexture('bulletTexture', 8, 8);
            texGraphics.clear();

            texGraphics.fillStyle(0xff8c00); 
            texGraphics.fillCircle(6, 6, 6); 
            texGraphics.generateTexture('boilingBulletTexture', 12, 12);
            
            texGraphics.destroy(); // 画完贴图后销毁画笔，释放内存
        }

        this.enemies = this.physics.add.group(); // 初始化敌人组
        this.bullets = this.physics.add.group(); // 初始化子弹组

        this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => {
            
            // 🚨 防止一发子弹打多次
            if (!bullet.active) return;
            
            // 🚨 终极护盾 1：防止鞭尸！如果怪物在这一帧已经死了，绝对不进行二次伤害和发钱！
            if (!enemy.active) return;

            // 调用 helper 处理伤害，并接收是否击杀的结果
            let isKilled = hitEnemy(bullet, enemy);

            // 如果敌人被这个子弹打死了
            if (isKilled) {
                this.playerMoney += 10;
                this.events.emit('updateMoney', this.playerMoney);
            }
        }, null, this);

        // ================= 4. 全新拖拽建造逻辑 =================

        this.buildingSystem = new BuildingSystem(this);
        this.buildingSystem.setupInputListeners();

        // create the hp bar graphics for towers and enemies
        this.hpGraphics = this.add.graphics();
        this.hpGraphics.setDepth(10);  // ensure hp bars are always on top of other sprites

        this.events.off('forceNextWave');

        this.events.on('forceNextWave', () => {
            // 调用 waveSystem 里的强制跳过倒计时方法
            // (你需要确保 waveSystem 里面有跳过等待、直接出怪的逻辑)
            if (this.waveSystem) {
                this.waveSystem.forceStartNextWave(); 
            }
        });

        // 🚨 终极护盾 2：当场景即将关闭/重启时，一刀切断所有残留的动画和物理运算！
        this.events.once('shutdown', () => {
            // 1. 强行停止所有敌人的内部路径动画！(这就是引起 cut 报错的终极元凶)
            if (this.enemies && this.enemies.scene) {
                this.enemies.getChildren().forEach(enemy => {
                    // 如果敌人身上有停止跟随的方法，立刻调用它
                    if (enemy && enemy.stopFollow) {
                        enemy.stopFollow(); 
                    }
                });
            }

            // 2. 杀掉所有残留的飘字和特效动画
            this.tweens.killAll();
        });
    }

    update(time, delta) {
        // 這裡放你原本 game.js 裡 update() 函數中的所有程式碼！
        // 包含生成敵人、塔的攻擊邏輯等
        if (!this.sys || !this.sys.isActive() || !this.enemies || !this.enemies.scene) return;

        if (this.isGameOver || this.isLevelWon) return; // 如果游戏结束了，就不执行后续的更新逻辑
        
        this.timeSystem.update(delta);

        const currentTime = this.timeSystem.time;

        this.waveSystem.update(currentTime);

        // 2. 防御塔工作逻辑 (包含攻击与产费)
        this.towers.forEach(tower => {

            if (!tower.isCooldownInitialized) {
                tower.nextFire = currentTime + 500;
                tower.nextGoldTime = currentTime + 2000;
                tower.nextHealTime = currentTime + 1000;
                tower.isCooldownInitialized = true; // 标记为已初始化
            }
            
            // ================= 火塔：攻击逻辑 =================
            // 只有攻击范围大于0的塔（火塔）才会索敌开火
            if (tower.type === 'fire') {
                if (currentTime > tower.nextFire) {
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
                        // ✅ 核心修复：防止时间误差累积吞子弹
                        if (currentTime - tower.nextFire > 500) {
                            // 如果塔闲置了很久（敌人刚进入范围），以当前时间重置
                            tower.nextFire = currentTime + 500; 
                        } else {
                            // 如果在持续射击，精确累加，绝不吞噬毫秒误差！
                            tower.nextFire += 500; 
                        }
                    }
                }
            }

            // ================= 金塔：产费逻辑 =================
            if (tower.type === 'gold') {
                // 如果当前时间超过了下次产费时间
                if (currentTime > tower.nextGoldTime) {
                    
                    // 1. 增加玩家金币并更新右上角UI
                    this.playerMoney += 10; // 每次产费增加10金币
                    // this.moneyText.setText('💰 費用: ' + this.playerMoney);
                    
                    // // 2. 做一个酷炫的飘字特效，告诉玩家“加钱了！”
                    let floatText = this.add.text(tower.x - 10, tower.y - 20, '+10$', { 
                        fontSize: '18px', fill: '#ffd700', fontStyle: 'bold' 
                    });
                    // // 使用 Phaser 的补间动画 (Tween) 让文字向上飘并渐渐变透明
                    this.tweens.add({
                        targets: floatText,
                        y: tower.y - 50, // 往上飘 30 像素
                        alpha: 0,        // 透明度变成 0
                        duration: 1000,  // 动画持续 1 秒
                        onComplete: () => floatText.destroy() // 动画结束后销毁文字，节省内存
                    });

                    this.events.emit('updateMoney', this.playerMoney); // emit an event to update money in UI

                    // 3. 设定下一次产费的时间 (当前时间 + 2000毫秒)
                    tower.nextGoldTime += 2000; 
                }
            }

            // ================= 水塔：群体治疗逻辑 =================
            if (tower.type === 'water') {
                // 每 1000 毫秒（1秒）触发一次
                if (currentTime > tower.nextHealTime) {
                    
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

                    tower.nextHealTime += 1000; 
                }
            }
        });

        this.enemyAttackSystem.update(currentTime); // 调用敌人攻击系统的更新方法

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

        this.hpGraphics.clear();

        // set the tower hp bars
        this.towers.forEach(tower => {
            if (tower.active && tower.hp < tower.maxHp) {
                this.drawHpBar(tower.x, tower.y - 25, tower.hp, tower.maxHp);
            }
        })

        // set the enemy hp bars
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.active && enemy.hp < enemy.maxHp) {
                this.drawHpBar(enemy.x, enemy.y - 20, enemy.hp, enemy.maxHp, true);
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

        let textureToUse = config.textureKey ? config.textureKey : 'enemyTexture';

        // 2. 建立敵人實體並加入群組 (動態讀取起點座標)
        let startX = this.pathSystem.currentFullPath[0].x;
        let startY = this.pathSystem.currentFullPath[0].y;
        let enemy = this.add.follower(this.path, startX, startY, textureToUse);
        this.enemies.add(enemy);

        enemy.setDepth(2);
        
        // enemy.setDisplaySize(this.cellSize, this.cellSize);
        enemy.setDisplaySize(30, 30);
        
        // 3. 套用設定檔裡的數值
        enemy.hp = config.hp; 
        enemy.maxHp = config.hp;
        enemy.damage = config.damage;
        enemy.attackRange = config.attackRange; 
        enemy.attackCooldown = config.attackCooldown;
        enemy.nextAttack = 0;   
        enemy.spawnTime = currentTime; 

        // let enemy remember its speed
        enemy.speed = config.speed;

        // 4. 計算走完路徑所需的時間 (時間 = 距離 / 速度)
        // 假設路徑總長度約為 1440 像素，乘以 1000 轉換為毫秒
        const pathLength = this.path.getLength(); 
        const duration = (pathLength / config.speed) * 1000;

        // 5. 開始沿著路徑移動
        enemy.startFollow({
            duration: duration, 
            rotateToPath: false,
            onComplete: () => {
                this.onEnemyReachEnd(enemy);
            }
        });
    }

    // Called when an enemy reaches the end of the path
    onEnemyReachEnd(enemy) {
        if (enemy && enemy.active) {
            enemy.destroy(); 
                    
            this.playerLives -= 1; 

            this.events.emit('updateLives', this.playerLives); // emit an event to update lives in UI

            // this.livesText.setText('❤️ 生命: ' + this.playerLives); 
                    
            // 扣血飄字特效
            let dmgText = this.add.text(enemy.x, enemy.y - 20, '-1 生命', { fill: '#ff0000', fontStyle: 'bold' });
            this.tweens.add({ targets: dmgText, y: enemy.y - 50, alpha: 0, duration: 1000, onComplete: () => dmgText.destroy() });

            // 遊戲結束判定
            if (this.playerLives <= 0 && !this.isGameOver) {
                this.isGameOver = true;    
                this.physics.pause(); 
                this.tweens.pauseAll(); 

                this.events.emit('gameOver'); // emit an event to notify UI about game over
            }
        }
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

    // this is a helper function to update the textures of the map
    updateMapTiles() {
        if (!this.mapTiles) return;

        // for all map tiles
        this.mapTiles.forEach(tileData => {
            // check if the center of this tile is in the current path
            let isPath = this.pathSystem.currentFullPath.some(p => p.x === tileData.cx && p.y === tileData.cy);

            let baseKey = isPath ? 'dirt' : 'grass';
            let textureKey = tileData.isVariant ? baseKey + '1' : baseKey;
            
            // change the texture of this tile based on whether it's a path tile or not
            tileData.image.setTexture(textureKey).setDisplaySize(this.cellSize, this.cellSize);
        });
    }

    drawHpBar(x, y, currentHp, maxHp) {
        const width = 30;  // length of the hp bar
        const height = 4;  // height of the hp bar
        const startX = x - width / 2;
        const startY = y;

        // draw the red background (total hp)
        this.hpGraphics.fillStyle(0xff0000, 1);
        this.hpGraphics.fillRect(startX, startY, width, height);

        // draw the green foreground (current hp)
        const greenWidth = width * (currentHp / maxHp);
        this.hpGraphics.fillStyle(0x00ff00, 1);
        this.hpGraphics.fillRect(startX, startY, greenWidth, height);
    }

    // updaye enemies' path compulsorily called after building or demolishing towers, 
    // to make sure enemies always take the correct path
    updateEnemiesPath() {
        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.active) return;

            // 1. stop!!!
            enemy.stopFollow();

            let targetIndex = 0;
            let onSegment = false;

            // 2. firstly, we try to find out if the enemy is still on the original path (but maybe just a bit off due to tower blocking), 
            // if so, we can directly set the next target to be the next waypoint on the original path, without calculating distance to all waypoints
            for (let i = 0; i < this.pathSystem.currentFullPath.length - 1; i++) {
                let p1 = this.pathSystem.currentFullPath[i];
                let p2 = this.pathSystem.currentFullPath[i + 1];
                
                let d1 = Phaser.Math.Distance.Between(enemy.x, enemy.y, p1.x, p1.y);
                let d2 = Phaser.Math.Distance.Between(enemy.x, enemy.y, p2.x, p2.y);
                let segmentLen = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);

                // if the enemy is approximately on the line segment between p1 and p2 
                // (considering a tolerance of < 2 pixels due to possible floating point inaccuracies in Phaser coordinates),
                if (Math.abs((d1 + d2) - segmentLen) < 2) { 
                    // if the enemy is close enough to the line segment, 
                    // we consider it still on the original path and set the next target to be p2
                    targetIndex = i + 1; 
                    onSegment = true;
                    break;
                }
            }

            // 3. if the enemy is not on any of the original path segments, 
            // it means it has been pushed off the path (e.g. by a tower being built right in front of it),
            // in this case we will fall back to the original logic of finding the closest waypoint as the next target, 
            // to avoid breaking the pathfinding completely
            if (!onSegment) {
                let minDistance = Infinity;
                for (let i = 0; i < this.pathSystem.currentFullPath.length; i++) {
                    let p = this.pathSystem.currentFullPath[i];
                    let dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, p.x, p.y);
                    if (dist < minDistance) {
                        minDistance = dist;
                        targetIndex = i;
                    }
                }
            }

            // 4. we will create a new temporary path for this enemy, 
            // starting from its current position, and then connecting to the remaining waypoints from targetIndex onwards
            let remainingPath = this.add.path(enemy.x, enemy.y);
            
            // push the remaining waypoints into this new path
            for (let i = targetIndex; i < this.pathSystem.currentFullPath.length; i++) {
                let p = this.pathSystem.currentFullPath[i];
                remainingPath.lineTo(p.x, p.y);
            }

            // 5. calculate the length of this remaining path, and based on the enemy's speed, 
            // calculate how long it should take for the enemy to walk through this new path,
            let remainingLength = remainingPath.getLength();
            let newDuration = (remainingLength / enemy.speed) * 1000;

            // 6. set the enemy to follow this new path with the new duration, 
            // and make sure to call the same onComplete callback when it reaches the end,
            enemy.setPath(remainingPath);
            enemy.startFollow({
                duration: newDuration,
                rotateToPath: false,
                onComplete: () => {
                    this.onEnemyReachEnd(enemy);
                }
            });
        });
    }

    // 原本寫在全域的輔助函數 (例如 getEnemyInRange, shoot) 
    // 可以變成這個 Class 裡面的方法 (Method)，或者保留在外面當全域函數也可以。
}