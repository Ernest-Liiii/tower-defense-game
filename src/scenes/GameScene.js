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
import { TowerSystem } from '../systems/TowerSystem.js';
import { MusicSystem } from '../systems/MusicSystem.js';
import { ReactionSystem } from '../systems/ReactionSystem.js';
import { UpgradeSystem } from '../systems/UpgradeSystem.js';

// import the data for levels and towers
import { LEVEL_DATA } from '../config/level_data.js';
import { TOWER_DATA } from '../config/tower_data.js';
import { ENEMY_DATA } from '../config/enemy_data.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.MusicSystem = null; // initialize the music system property
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

        // initialize the Tower System
        this.towerSystem = new TowerSystem(this);

        // initialize the Reaction System
        this.ReactionSystem = new ReactionSystem(this);

        // initialize the Upgrade System
        this.UpgradeSystem = new UpgradeSystem(this);
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
        this.load.image('flying', 'assets/images/Flying.png')
        this.load.image('boss_slime', 'assets/images/BossSlime.png');
        this.load.image('middle_slime', 'assets/images/MiddleSlime.png');
        this.load.image('mini_slime', 'assets/images/MiniSlime.png');
        this.load.image('elemental_devourer', 'assets/images/ElementalDevourer.png');

        // load the textures of the towers
        this.load.image('water_tower', 'assets/images/WaterTower.png')
        this.load.image('gold_tower', 'assets/images/GoldTower.png')
        this.load.image('fire_tower', 'assets/images/FireTower.png')
        this.load.image('wood_tower', 'assets/images/WoodTower.png')
        this.load.image('earth_tower', 'assets/images/EarthTower.png')

        // load the audio files for bgm
        this.load.audio('level1_bgm', 'assets/audio/Level_1.mp3')
    }

    create() {
        this.musicSystem = new MusicSystem(this); // create an instance of the music system
        this.musicSystem.playBGM('level1_bgm', 0.3); // play the background music for level 1

        // 定義網格單元格大小
        this.cellSize = 40;
        // 這裡放你原本 game.js 裡 create() 函數中的所有程式碼！
        // 包含建立網格、UI、註冊拖拽事件等

        this.scene.launch('GameUI');  // launch the UI scene

        // this.add.text(20, 20, 'Level 1: Tutorial Level', { fontSize: '20px', fill: '#00ff00' });
        
        if (this.pathSystem.currentFullPath.length > 0) {
            let startPoint = this.pathSystem.currentFullPath[0];
            this.path = this.add.path(startPoint.x, startPoint.y);
            
            for (let i = 1; i < this.pathSystem.currentFullPath.length; i++) {
                let p = this.pathSystem.currentFullPath[i];
                this.path.lineTo(p.x, p.y);
            }
        }

        if (this.pathSystem.waypoints.length > 0) {
            let startWp = this.pathSystem.waypoints[0];
            let startX = startWp.col * this.cellSize + this.cellSize / 2;
            let startY = startWp.row * this.cellSize + this.cellSize / 2;

            this.flyingPath = this.add.path(startX, startY);

            // 直接将点与点之间拉直线
            for (let i = 1; i < this.pathSystem.waypoints.length; i++) {
                let wp = this.pathSystem.waypoints[i];
                let wpX = wp.col * this.cellSize + this.cellSize / 2;
                let wpY = wp.row * this.cellSize + this.cellSize / 2;
                this.flyingPath.lineTo(wpX, wpY);
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
            texGraphics.clear();

            // 火塔的特效
            // 底层：半透明的红色外围光晕
            texGraphics.fillStyle(0xff2a00, 0.4); 
            texGraphics.fillCircle(8, 8, 8);           
            // 中层：较亮的橙色过渡
            texGraphics.fillStyle(0xff8800, 0.8); 
            texGraphics.fillCircle(8, 8, 5);         
            // 顶层：极亮的高温白黄色核心
            texGraphics.fillStyle(0xffffff, 1);   
            texGraphics.fillCircle(8, 8, 2); 
            // 生成稍微大一点的贴图 (16x16)
            texGraphics.generateTexture('spark', 16, 16); 
            texGraphics.clear();

            // 木塔的特效
            texGraphics.fillStyle(0x2ecc71, 0.4); 
            texGraphics.fillCircle(8, 8, 8);
            texGraphics.fillStyle(0x27ae60, 0.8); 
            texGraphics.fillCircle(8, 8, 4);
            texGraphics.generateTexture('poison_spore', 16, 16);
            texGraphics.clear();

            // 金塔的特效
            // 底层：半透明的金色圆形光晕
            texGraphics.fillStyle(0xffd700, 0.3);
            texGraphics.fillCircle(8, 8, 6);            
            // 中层：黄金色的“细”十字星芒
            texGraphics.fillStyle(0xffe600, 0.9);
            texGraphics.fillRect(7, 2, 2, 12); // 极细的竖线
            texGraphics.fillRect(2, 7, 12, 2); // 极细的横线         
            // 顶层：最亮眼的纯白高光中心
            texGraphics.fillStyle(0xffffff, 1);
            texGraphics.fillRect(7, 7, 2, 2);
            texGraphics.generateTexture('gold_glint', 16, 16);
            texGraphics.clear();

            // 土塔的特效
            texGraphics.fillStyle(0x8b7355, 0.9);
            texGraphics.fillRect(0, 0, 6, 6);
            texGraphics.generateTexture('earth_dust', 6, 6);
            texGraphics.clear();

            // 水塔的特效
            texGraphics.fillStyle(0x00aaff, 0.5);
            texGraphics.fillCircle(6, 6, 6);
            texGraphics.fillStyle(0xffffff, 0.8);
            texGraphics.fillCircle(4, 4, 2); // 水泡的高光
            texGraphics.generateTexture('water_bubble', 12, 12);
            texGraphics.clear();
            
            texGraphics.destroy(); // 画完贴图后销毁画笔，释放内存
        }

        this.enemies = this.physics.add.group(); // 初始化敌人组
        this.bullets = this.physics.add.group(); // 初始化子弹组

        this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => {
            
            // 🚨 防止一发子弹打多次
            if (!bullet.active) return;
            
            // 🚨 终极护盾 1：防止鞭尸！如果怪物在这一帧已经死了，绝对不进行二次伤害和发钱！
            if (!enemy.active) return;

            // 如果这发子弹有明确的目标，且碰到的敌人不是它的目标，就直接穿透（无视）！
            if (bullet.target && bullet.target !== enemy) {
                return;
            }

            // boss 免疫护盾检测
            if (enemy.currentImmunity === bullet.towerType) {
                // 如果当前免疫此塔的属性，子弹直接销毁，不造成任何伤害和负面效果
                bullet.destroy();
                if (bullet.trailEmitter) bullet.trailEmitter.destroy();
                
                let immuneText = this.add.text(enemy.x, enemy.y, 'IMMUNE', { fill: '#cccccc', fontSize: '12px' });
                this.tweens.add({ targets: immuneText, y: enemy.y - 30, alpha: 0, duration: 800, onComplete: () => immuneText.destroy() });
                return; // 直接返回，跳过后面的伤害、爆炸、上毒逻辑！
            }

            // 调用 helper 处理伤害，并接收是否击杀的结果
            let isKilled = hitEnemy(bullet, enemy);

            // 增加火塔击中敌人的爆炸特效
            if (bullet.towerType === 'fire' || bullet.texture.key === 'boilingBulletTexture') {
                let explosion = this.add.particles(enemy.x, enemy.y, 'spark', {
                    speed: { min: 50, max: 200 },     // 爆炸速度极快，四散溅开
                    scale: { start: 1.2, end: 0 },    // 从大变小
                    alpha: { start: 1, end: 0 },
                    blendMode: 'ADD',
                    lifespan: { min: 200, max: 400 }, // 存活时间很短，形成瞬间爆炸感
                    emitting: false                   // 【关键】设为 false，禁止它持续喷射
                });

                explosion.setDepth(15); // 确保爆炸特效显示在最上层
                explosion.explode(15);  // 【关键】瞬间向四周爆开 15 个粒子！

                // 爆炸结束后（500毫秒），销毁发射器释放内存
                this.time.delayedCall(500, () => {
                    explosion.destroy();
                });
            }

            if (bullet.towerType === 'wood') {
                let splash = this.add.particles(enemy.x, enemy.y, 'poison_spore', {
                    speed: { min: 20, max: 60 },      // 飞溅速度不用像爆炸那么快
                    scale: { start: 1, end: 0.2 },    // 缩小，模拟水滴飞散
                    alpha: { start: 0.7, end: 0 },
                    lifespan: { min: 300, max: 500 }, // 很快消失
                    emitting: false                   // 禁止自动喷射
                });

                splash.setDepth(15);
                splash.explode(10);  // 命中瞬间爆出 10 滴毒液粒子

                // 同样在结束以后销毁发射器
                this.time.delayedCall(600, () => {
                    splash.destroy();
                });
            }

            if (!isKilled && bullet.towerType === 'wood') {
                const currentTime = this.timeSystem.time;
                
                // 挂载中毒 (持续 3 秒，首次触发在 0.5 秒后)
                enemy.isPoisoned = true;

                enemy.poisonEndTime = currentTime + 3000;
                enemy.nextPoisonTick = currentTime + 500;

                // 挂载减速 (持续 3 秒)
                enemy.isSlowed = true;
                enemy.slowEndTime = currentTime + 3000;

                enemy.isSuperPoison = bullet.isSuperPoison;
                
                // 飘个绿字提示玩家
                let debuffText = this.add.text(enemy.x, enemy.y - 20, 'Poisoned/Slowed', { fill: '#2ecc71', fontSize: '12px' });
                this.tweens.add({ targets: debuffText, y: enemy.y - 40, alpha: 0, duration: 800, onComplete: () => debuffText.destroy() });
            }

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

            // 3. 停止所有正在播放的音乐
            if (this.musicSystem) {
                this.musicSystem.stopBGM(true);
            }
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

        this.towerSystem.update(currentTime); // 调用塔系统的更新方法

        this.enemyAttackSystem.update(currentTime); // 调用敌人攻击系统的更新方法

        this.ReactionSystem.update(currentTime);

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
                    
                    // 销毁子弹拖尾
                    if (bullet.trailEmitter) {
                        bullet.trailEmitter.destroy();
                    }
                }
            }
        });

        this.hpGraphics.clear();

        // set the tower hp bars
        this.towers.forEach(tower => {
            if (!tower.active) return;

            if (tower.type === 'fire' && tower.rangeGraphic) {
                drawDirectionalRange(tower.rangeGraphic, tower.x, tower.y, tower.direction, tower.type, tower.range, 0.15, tower.isWoodBuffed);
            }

            if (tower.hp < tower.maxHp || (tower.shield && tower.shield > 0)) {
                this.drawHpBar(tower.x, tower.y - 25, tower.hp, tower.maxHp, false, tower.shield || 0);
            }

            // for debugging only
            if (tower.active) {
                // create debug text
                if (!tower.debugText) {
                    tower.debugText = this.add.text(tower.x, tower.y - 40, '', { 
                        fontSize: '12px', fill: '#ffffff', fontStyle: 'bold', backgroundColor: '#00000088'
                    }).setOrigin(0.5);
                    tower.debugText.setDepth(300);
                }

                // detect and show the status text
                let buffString = '';
                if (tower.isWaterBuffed) buffString += '💧';
                if (tower.isWoodBuffed)  buffString += '🌿';
                if (tower.isFireBuffed)  buffString += '🔥';
                if (tower.isEarthBuffed) buffString += '🪨';
                if (tower.isGoldBuffed)  buffString += '💰';

                tower.debugText.setText(buffString);
            }
        })

        // set the enemy hp bars
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.active && enemy.hp < enemy.maxHp) {
                this.drawHpBar(enemy.x, enemy.y - 20, enemy.hp, enemy.maxHp, true);
            }

            if (enemy.active && enemy.bossType === 'devourer') {
                this.handleDevourerLogic(enemy, currentTime);
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

        let isFlying = config.isFlying || false;
        let pathToFollow = isFlying ? this.flyingPath : this.path;

        // 2. 建立敵人實體並加入群組 (動態讀取起點座標)
        let startPoint = pathToFollow.getStartPoint();
        let startX = startPoint.x;
        let startY = startPoint.y;

        let enemy = this.add.follower(pathToFollow, startX, startY, textureToUse);
        this.enemies.add(enemy);

        enemy.setDepth(isFlying ? 5 : 2);

        enemy.isFlying = isFlying;

        let bossTextureKey = config.textureKey; // store the texture key for later use in sizing
        
        // enemy.setDisplaySize(this.cellSize, this.cellSize);
        if (bossTextureKey === 'boss_slime') {
            enemy.setDisplaySize(90, 45);
        } else if (bossTextureKey === 'elemental_devourer') {
            enemy.setDisplaySize(80, 80);
        }
        else if (isFlying) {
            enemy.setDisplaySize(55, 55); 
        } else {
            enemy.setDisplaySize(30, 30); // 地面敌人保持原来的大小
        }
        
        // 3. 套用設定檔裡的數值
        enemy.hp = config.hp; 
        enemy.maxHp = config.hp;
        enemy.damage = config.damage;
        enemy.attackRange = config.attackRange; 
        enemy.attackCooldown = config.attackCooldown;
        enemy.nextAttack = 0;   
        enemy.spawnTime = currentTime; 
        enemy.bossType = config.bossType || null;

        // let enemy remember its speed
        enemy.speed = config.speed;

        // 分裂敌人的属性
        enemy.splitInto = config.splitInto || null;
        enemy.splitCount = config.splitCount || 0;

        // 4. 計算走完路徑所需的時間 (時間 = 距離 / 速度)
        // 假設路徑總長度約為 1440 像素，乘以 1000 轉換為毫秒
        const pathLength = pathToFollow.getLength(); 
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

            if (enemy.shieldEmitter) enemy.shieldEmitter.destroy();
                    
            this.playerLives -= 1; 

            this.events.emit('updateLives', this.playerLives); // emit an event to update lives in UI

            // this.livesText.setText('❤️ 生命: ' + this.playerLives); 
                    
            // 扣血飄字特效
            let dmgText = this.add.text(enemy.x, enemy.y - 20, '-1 lives', { fill: '#ff0000', fontStyle: 'bold' });
            this.tweens.add({ targets: dmgText, y: enemy.y - 50, alpha: 0, duration: 1000, onComplete: () => dmgText.destroy() });

            // 遊戲結束判定
            if (this.playerLives <= 0 && !this.isGameOver) {
                this.isGameOver = true;    

                this.musicSystem.stopBGM(); // stop the background music when game is over

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

    drawHpBar(x, y, currentHp, maxHp, isEnemy = false, shield = 0) {
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

        if (shield > 0) {
            const shieldWidth = width * (shield / maxHp);
            const shieldStartX = startX + width - shieldWidth;

            this.hpGraphics.fillStyle(0xFFFFFF, 0.8);
            this.hpGraphics.fillRect(shieldStartX, startY, shieldWidth, height);

            this.hpGraphics.lineStyle(1, 0xFFFFFF, 1);
            this.hpGraphics.strokeRect(shieldStartX, startY, shieldWidth, height);
        }
    }

    // updaye enemies' path compulsorily called after building or demolishing towers, 
    // to make sure enemies always take the correct path
    updateEnemiesPath() {
        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.active) return;

            if (enemy.isFlying) return;

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

    // 处理分裂敌人的函数
    handleEnemySplit(x, y, parentEnemy) {
        let splitType = parentEnemy.splitInto;
        let splitCount = parentEnemy.splitCount;
        const config = ENEMY_DATA[splitType];
        
        if (!config) return;

        // 1. 寻找大史莱姆死前距离哪个路径点最近
        let targetIndex = 0;
        let minDistance = Infinity;
        for (let i = 0; i < this.pathSystem.currentFullPath.length; i++) {
            let p = this.pathSystem.currentFullPath[i];
            let dist = Phaser.Math.Distance.Between(x, y, p.x, p.y);
            if (dist < minDistance) {
                minDistance = dist;
                targetIndex = i;
            }
        }

        // 2. 建立剩余路径
        let remainingPath = this.add.path(x, y);
        for (let i = targetIndex; i < this.pathSystem.currentFullPath.length; i++) {
            let p = this.pathSystem.currentFullPath[i];
            remainingPath.lineTo(p.x, p.y);
        }
        let remainingLength = remainingPath.getLength();

        // 3. 生成分裂的子代史莱姆
        for (let i = 0; i < splitCount; i++) {
            let textureToUse = config.textureKey || 'enemyTexture';
            
            // 在原地生成小怪
            let childEnemy = this.add.follower(remainingPath, x, y, textureToUse);
            this.enemies.add(childEnemy);

            childEnemy.setDepth(2);
            childEnemy.isFlying = parentEnemy.isFlying;

            if (splitType === 'middle_slime') {
                childEnemy.setDisplaySize(45, 45); // 中史莱姆体型
            } else if (splitType === 'mini_slime') {
                childEnemy.setDisplaySize(70, 70); // 小史莱姆体型
            } else {
                childEnemy.setDisplaySize(30, 30);
            }

            // 赋予战斗数值
            childEnemy.hp = config.hp;
            childEnemy.maxHp = config.hp;
            childEnemy.damage = config.damage;
            childEnemy.attackRange = config.attackRange || 45;
            childEnemy.attackCooldown = config.attackCooldown || 2000;
            childEnemy.nextAttack = 0;
            
            // ✅ 【核心新增 2】继承分裂基因！让中史莱姆死后能继续分裂成小史莱姆
            childEnemy.splitInto = config.splitInto || null;
            childEnemy.splitCount = config.splitCount || 0;
            
            // 让它们速度有随机差异，拉开阵型
            childEnemy.speed = config.speed + Phaser.Math.Between(-8, 8); 
            childEnemy.spawnTime = this.timeSystem.time;

            // 4. 计算走完剩余路径需要的时间
            let newDuration = (remainingLength / childEnemy.speed) * 1000;

            // 5. 让分裂出来的怪物开始冲刺
            childEnemy.startFollow({
                duration: newDuration,
                rotateToPath: false,
                onComplete: () => {
                    this.onEnemyReachEnd(childEnemy);
                }
            });
        }
    }

    handleDevourerLogic(boss, currentTime) {
        // 1. 初始化 Boss 状态 (刚出生时触发)
        if (!boss.devourerInitialized) {
            boss.isPhase2 = false;
            boss.nextShieldTime = currentTime + 30000; // 30秒后刷新护盾
            boss.nextSealTime = currentTime + 10000;   // 10秒后封印
            boss.currentImmunity = Phaser.Math.RND.pick(['wood', 'fire']); // 初始随机免疫一个
            boss.devourerInitialized = true;
            
            // 飘字提示当前免疫
            this.showBossText(boss, `Immune: ${boss.currentImmunity.toUpperCase()}!`, '#00ffff');

            let tex = boss.currentImmunity === 'fire' ? 'spark' : 'poison_spore';
            let blend = boss.currentImmunity === 'fire' ? 'ADD' : 'NORMAL';
            
            // 为 Boss 添加一个持续的护盾粒子特效，颜色和混合模式根据当前免疫属性变化
            boss.shieldEmitter = this.add.particles(0, 0, tex, {
                // 去掉外扩的 speed，让粒子留在圆环上
                scale: { start: 1.2, end: 0 },
                alpha: { start: 0.8, end: 0 },
                lifespan: 600,
                frequency: 20, // 频率调快，让圈圈更密集
                blendMode: blend,
                emitZone: {
                    type: 'edge',
                    source: new Phaser.Geom.Circle(0, 0, 45), // 45 是护盾的半径，刚好包住 Boss
                    quantity: 40 // 圆环由 40 个生成点组成
                }
            });
            boss.shieldEmitter.setDepth(boss.depth + 1);
            boss.shieldEmitter.startFollow(boss);
        }

        // 2. 阶段转换检测 (血量低于 50% 且还没进 P2)
        if (!boss.isPhase2 && boss.hp <= boss.maxHp * 0.5) {
            boss.isPhase2 = true;
            boss.setTint(0xff0000); // 身体变红！
            boss.currentImmunity = 'earth'; // 失去火/木护盾，获得土系(眩晕)免疫
            this.showBossText(boss, 'PHASE 2: Earth Immune & Double Seal!', '#ff0000');

            // 解除眩晕状态
            boss.isStunned = false;
            if (boss.resumeFollow) boss.resumeFollow();

            // 销毁旧护盾
            if (boss.shieldEmitter) boss.shieldEmitter.destroy();
            boss.shieldEmitter = this.add.particles(0, 0, 'earth_dust', {
                scale: { start: 1.5, end: 0 },
                alpha: { start: 0.8, end: 0 },
                lifespan: 800,
                frequency: 30,
                rotate: { start: 0, end: 360 }, // 碎石翻滚
                // 同样加上圆环边缘属性，土系护盾稍微大一点！
                emitZone: {
                    type: 'edge',
                    source: new Phaser.Geom.Circle(0, 0, 50), // 碎石环绕圈大一点
                    quantity: 36
                }
            });
            boss.shieldEmitter.setDepth(boss.depth + 1);
            boss.shieldEmitter.startFollow(boss);
        }

        // 3. 护盾刷新机制 (仅限第一阶段，每 30 秒触发)
        if (!boss.isPhase2 && currentTime >= boss.nextShieldTime) {
            boss.currentImmunity = Phaser.Math.RND.pick(['wood', 'fire']);
            this.showBossText(boss, `Immune: ${boss.currentImmunity.toUpperCase()}!`, '#00ffff');
            
            if (boss.shieldEmitter) {
                boss.shieldEmitter.setTexture(boss.currentImmunity === 'fire' ? 'spark' : 'poison_spore');
                boss.shieldEmitter.blendMode = boss.currentImmunity === 'fire' ? Phaser.BlendModes.ADD : Phaser.BlendModes.NORMAL;
            }

            boss.nextShieldTime = currentTime + 30000; // 重置冷却
        }

        // 4. 封印塔机制 (每 10 秒触发)
        if (currentTime >= boss.nextSealTime) {
            let sealCount = boss.isPhase2 ? 5 : 2; // P2 封五座，P1 封两座
            this.sealRandomTowers(sealCount, currentTime);
            boss.nextSealTime = currentTime + 10000; // 重置冷却
        }
    }

    // 封印地图上的随机防御塔
    sealRandomTowers(count, currentTime) {
        let activeTowers = this.towers.filter(t => t.active && !t.isSealed); // 找出还没被封印的存活塔
        
        if (activeTowers.length === 0) return;

        if (count > activeTowers.length) {
            count = activeTowers.length; // 如果要求封印的数量超过了剩余的塔，就只封印剩下的全部
        }

        // 随机打乱塔的数组并抽取
        Phaser.Utils.Array.Shuffle(activeTowers);
        let targets = activeTowers.slice(0, count);

        targets.forEach(tower => {
            tower.isSealed = true;
            tower.sealEndTime = currentTime + 20000; // 封印 20 秒
            tower.setTint(0x555555); // 塔变灰暗，表示被封印
            
            let sealText = this.add.text(tower.x, tower.y - 20, 'SEALED!', { fill: '#a832a8', fontStyle: 'bold' }).setOrigin(0.5);
            this.tweens.add({ targets: sealText, y: tower.y - 50, alpha: 0, duration: 1500, onComplete: () => sealText.destroy() });

            // 为被封印的塔增加“暗紫气场”特效
            let sealEmitter = this.add.particles(tower.x, tower.y, 'water_bubble', {
                tint: 0x8a2be2,                   // 将原本的水泡染成暗紫色
                speed: { min: -10, max: 10 },     // 像沼泽一样黏稠地冒泡
                scale: { start: 0.8, end: 0 },
                alpha: { start: 0.7, end: 0 },
                lifespan: 800,
                frequency: 80
            });
            sealEmitter.setDepth(15);
            tower.sealEmitter = sealEmitter;      // 存到塔身上，解封时销毁
            
            // 封印时，暂停塔原有的待机特效（比如金塔的星星停止闪烁）
            if (tower.emitter) tower.emitter.pause();
        });
    }

    // 在 Boss 头顶飘专属技能提示的 helper
    showBossText(enemy, text, color) {
        let txt = this.add.text(enemy.x, enemy.y - 50, text, { fill: color, fontStyle: 'bold', fontSize: '16px' }).setOrigin(0.5);
        this.tweens.add({ targets: txt, y: enemy.y - 80, alpha: 0, duration: 2500, onComplete: () => txt.destroy() });
    }

    // 原本寫在全域的輔助函數 (例如 getEnemyInRange, shoot) 
    // 可以變成這個 Class 裡面的方法 (Method)，或者保留在外面當全域函數也可以。
}