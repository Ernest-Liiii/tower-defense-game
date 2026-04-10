// this file is used to set the game building system

// import need data and functions
import { TOWER_DATA } from '../config/tower_data.js';
import { drawDirectionalRange } from '../utils/towerHelpers.js';

export class BuildingSystem {
    constructor(scene) {
        this.scene = scene;
        
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.currentDragDir = 'up';
        this.previewTower = null;
        this.previewRange = null;
    }

    // set up the input listener
    setupInputListeners() {
        // ================= Stage 1: point down the mouse =================
        this.scene.input.on('pointerdown', (pointer, gameObjects) => {
            if (this.scene.isGameOver || this.scene.isLevelWon) return;

            // ✅ 【新增】处理点击到已有物体的逻辑
            if (gameObjects.length > 0) {
                let clickedObj = gameObjects[0];
                
                // 如果点到的是升级/出售按钮，直接 return，让按钮自己的事件去处理
                if (clickedObj.isMenuBtn) return; 

                // 如果点到的是已经建好的塔，显示弹出菜单
                if (clickedObj.isBuiltTower) {
                    this.showTowerMenu(clickedObj);
                    return; 
                }

                // 如果点到右侧 UI 面板等其他东西，隐藏菜单并退出
                this.hideTowerMenu();
                return; 
            }

            // ✅ 点到了空地，先隐藏菜单，然后继续执行原本的建造逻辑
            this.hideTowerMenu();

            const gridX = Math.floor(pointer.x / this.scene.cellSize) * this.scene.cellSize;
            const gridY = Math.floor(pointer.y / this.scene.cellSize) * this.scene.cellSize;
            const centerX = gridX + this.scene.cellSize / 2;
            const centerY = gridY + this.scene.cellSize / 2;

            // 1. Path collision detection
            let isWaypoint = this.scene.pathSystem.waypoints.some(wp => {
                let wpX = wp.col * this.scene.cellSize + this.scene.cellSize / 2;
                let wpY = wp.row * this.scene.cellSize + this.scene.cellSize / 2;
                return wpX === centerX && wpY === centerY;
            });
            if (isWaypoint) {
                let warning = this.scene.add.text(pointer.x, pointer.y - 20, '不能蓋在據點上!', { fill: '#ff0000', fontStyle: 'bold' });
                this.scene.time.delayedCall(1000, () => warning.destroy());
                return;
            }

            // 2. Tower Defense Collision Detection
            let canBuild = true;
            this.scene.towers.forEach(t => { if(t.x === centerX && t.y === centerY) canBuild = false; });
            if(!canBuild) return;

            let isEnemyOnTile = false;
            if (this.scene.enemies && this.scene.enemies.children) {
                this.scene.enemies.getChildren().forEach(enemy => {
                    if (!enemy.active) return;
                    // 计算敌人距离这个格子中心的距离
                    let dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, centerX, centerY);
                    // 如果距离小于半个格子大小 (20)，说明敌人正踩在这个格子上
                    if (dist < 20) isEnemyOnTile = true;
                });
            }
            if (isEnemyOnTile) {
                let warning = this.scene.add.text(pointer.x, pointer.y - 20, '不能盖在敌人头上!', { fill: '#ff0000', fontStyle: 'bold' });
                this.scene.time.delayedCall(1000, () => warning.destroy());
                return;
            }

            // 3. use this.scene.currentSelectedTower to detect the cost
            let towerConfig = TOWER_DATA[this.scene.currentSelectedTower];
            if (this.scene.playerMoney < towerConfig.cost) {
                let warning = this.scene.add.text(pointer.x, pointer.y - 20, '費用不足!', { fill: '#ff0000' });
                this.scene.time.delayedCall(1000, () => warning.destroy());
                return;
            }

            // Get ready to drag
            this.isDragging = true;
            this.dragStartX = pointer.x;
            this.dragStartY = pointer.y;
            this.currentDragDir = 'up'; 

            // Create a preview tower
            if (this.scene.currentSelectedTower === 'fire') {
                this.previewTower = this.scene.add.image(centerX, centerY, 'fire_tower').setDisplaySize(this.scene.cellSize, this.scene.cellSize);
            } else {
                this.previewTower = this.scene.add.rectangle(centerX, centerY, 36, 36, towerConfig.color);
            }
            this.previewTower.alpha = 0.5; 
            this.previewRange = this.scene.add.graphics();
            drawDirectionalRange(this.previewRange, centerX, centerY, this.currentDragDir, this.scene.currentSelectedTower);
        });

        // ================= Stage 2: drag the mouse =================
        this.scene.input.on('pointermove', (pointer) => {
            if (!this.isDragging || !this.previewTower) return;

            let dx = pointer.x - this.dragStartX;
            let dy = pointer.y - this.dragStartY;

            if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                if (Math.abs(dx) > Math.abs(dy)) {
                    this.currentDragDir = dx > 0 ? 'right' : 'left';
                } else {
                    this.currentDragDir = dy > 0 ? 'down' : 'up';
                }
            }

            drawDirectionalRange(this.previewRange, this.previewTower.x, this.previewTower.y, this.currentDragDir, this.scene.currentSelectedTower);
        });

        // ================= Stage 3: release the mouse =================
        this.scene.input.on('pointerup', (pointer) => {
            if (!this.isDragging) return;
            
            let towerConfig = TOWER_DATA[this.scene.currentSelectedTower];
            let centerX = this.previewTower.x;
            let centerY = this.previewTower.y;

            // 【核心新增】1. 先放一個「假塔」進去測試
            let mockTower = { x: centerX, y: centerY, active: true };
            this.scene.towers.push(mockTower);

            // 【核心新增】2. 測試尋路系統能不能找到路
            let pathExists = this.scene.pathSystem.recalculatePath();

            // 【核心新增】3. 把假塔拿出來
            this.scene.towers.pop();

            // 【核心新增】4. 如果路被堵死了，拒絕建造！
            if (!pathExists) {
                this.scene.pathSystem.recalculatePath(); // 恢復原本的路線
                let warning = this.scene.add.text(centerX, centerY - 20, '不能完全堵死路線!', { fill: '#ff0000', fontStyle: 'bold' });
                this.scene.time.delayedCall(1000, () => warning.destroy());
                
                // 取消拖曳狀態
                this.isDragging = false;
                this.previewTower.destroy();
                this.previewRange.destroy();
                this.previewTower = null;
                this.previewRange = null;
                return; // 退出，不扣錢也不蓋塔
            }

            // Deduct costs and update the UI
            this.isDragging = false;
            this.scene.playerMoney -= towerConfig.cost;
            // this.scene.moneyText.setText('💰 費用: ' + this.scene.playerMoney);
            this.scene.events.emit('updateMoney', this.scene.playerMoney); // emit an event to update money in UI

            // Logic Behind Building Physical Towers
            let tower;
            if (this.scene.currentSelectedTower === 'fire') {
                tower = this.scene.add.image(centerX, centerY, 'fire_tower');
                tower.setDisplaySize(this.scene.cellSize, this.scene.cellSize);
                tower.direction = this.currentDragDir; 

                tower.rangeGraphic = this.scene.add.graphics();
                drawDirectionalRange(tower.rangeGraphic, centerX, centerY, this.currentDragDir, 'fire', 0.15);
                
            } else if (this.scene.currentSelectedTower === 'water') {
                tower = this.scene.add.image(centerX, centerY, 'water_tower');
                tower.setDisplaySize(this.scene.cellSize, this.scene.cellSize); 
            } else if (this.scene.currentSelectedTower === 'gold') {
                tower = this.scene.add.image(centerX, centerY, 'gold_tower');
                tower.setDisplaySize(this.scene.cellSize, this.scene.cellSize); 
            } else {
                tower = this.scene.add.rectangle(centerX, centerY, 36, 36, towerConfig.color);
            }

            tower.type = this.scene.currentSelectedTower;
            tower.hp = towerConfig.hp;
            tower.maxHp = towerConfig.hp;
            tower.damage = towerConfig.damage;
            tower.nextFire = 0;

            tower.setInteractive();     // 让塔可以被鼠标点击
            tower.isBuiltTower = true;  // 打上专属标记，方便识别
            tower.level = 1;            // 初始等级
            tower.cost = towerConfig.cost; // 记录造价，用来计算升级和出售的钱

            if (tower.type === 'gold') tower.nextGoldTime = 0;
            if (tower.type === 'water') {
                tower.nextHealTime = 0;
                tower.rangeGraphic = this.scene.add.rectangle(centerX, centerY, 200, 200, 0x3498db, 0.15);
            }

            // Add the tower to the tower array in GameScene
            this.scene.towers.push(tower);

            // recalculate the path and update to phaser
            this.scene.pathSystem.recalculatePath();

            // update the path in phaser
            this.scene.updatePhaserPath();

            // update the map tiles for the paths
            this.scene.updateMapTiles();

            // update the enemies' path to follow the new path
            this.scene.updateEnemiesPath();

            // clean preview
            this.previewTower.destroy();
            this.previewRange.destroy();
            this.previewTower = null;
            this.previewRange = null;
        });
    }

    showTowerMenu(tower) {
        this.hideTowerMenu(); // 先隐藏可能打开的其他菜单

        // 创建一个容器把按钮装起来，放在塔的上方
        this.towerMenu = this.scene.add.container(tower.x, tower.y - 40);
        this.towerMenu.setDepth(200);

        // 计算升级费用和回收价格
        let upgradeCost = tower.cost; // 假设升级费用等于建造费用
        let sellPrice = Math.floor(tower.cost * 0.5); // 出售回收 50%

        // 1. 升级按钮 (蓝色)
        let upgBtn = this.scene.add.text(2, -20, `⬆️ 升级($${upgradeCost})`, { 
            fontSize: '12px', fill: '#fff', backgroundColor: '#0984e3', padding: {x:4, y:4} 
        }).setInteractive().setOrigin(0, 0.5);
        upgBtn.isMenuBtn = true; // 打上标记，防止触发建造

        upgBtn.on('pointerdown', () => this.upgradeTower(tower, upgradeCost));

        // 如果满级了(比如3级)，或者钱不够，按钮变灰
        if (tower.level >= 3) {
            upgBtn.setText('MAX');
            upgBtn.setStyle({ backgroundColor: '#636e72' });
            upgBtn.disableInteractive();
        } else if (this.scene.playerMoney < upgradeCost) {
            upgBtn.setStyle({ backgroundColor: '#636e72' });
        }

        // 2. 出售按钮 (红色)
        let sellBtn = this.scene.add.text(-2, -20, `💰 出售(+$${sellPrice})`, { 
            fontSize: '12px', fill: '#fff', backgroundColor: '#d63031', padding: {x:4, y:4} 
        }).setInteractive().setOrigin(1, 0.5);
        sellBtn.isMenuBtn = true;

        sellBtn.on('pointerdown', () => this.sellTower(tower, sellPrice));

        this.towerMenu.add([sellBtn, upgBtn]);
    }

    hideTowerMenu() {
        if (this.towerMenu) {
            this.towerMenu.destroy();
            this.towerMenu = null;
        }
    }

    upgradeTower(tower, cost) {
        if (this.scene.playerMoney >= cost && tower.level < 3) {
            // 扣钱
            this.scene.playerMoney -= cost;
            this.scene.events.emit('updateMoney', this.scene.playerMoney);

            // 升级属性 (简单粗暴：伤害提升 50%，或者如果是金塔/水塔可以增加效果)
            tower.level++;
            tower.damage = Math.floor(tower.damage * 1.5);
            tower.maxHp += 50;
            tower.hp += 50;
            
            // 外观反馈：变大一点点，或者加个光环
            tower.scale += 0.1; 
            
            // 飘字提示
            let upgText = this.scene.add.text(tower.x, tower.y - 20, 'Level UP!', { fill: '#00ff00', fontStyle: 'bold' }).setOrigin(0.5);
            this.scene.tweens.add({ targets: upgText, y: tower.y - 50, alpha: 0, duration: 1000, onComplete: () => upgText.destroy() });

            this.hideTowerMenu();
        } else {
            // 钱不够的提示
            let warning = this.scene.add.text(tower.x, tower.y - 20, '费用不足!', { fill: '#ff0000' }).setOrigin(0.5);
            this.scene.time.delayedCall(1000, () => warning.destroy());
        }
    }

    sellTower(tower, price) {
        // 加钱
        this.scene.playerMoney += price;
        this.scene.events.emit('updateMoney', this.scene.playerMoney);

        // 摧毁绑定的攻击范围指示器
        if (tower.rangeGraphic) {
            tower.rangeGraphic.destroy();
        }

        // 彻底摧毁塔
        tower.active = false;
        tower.destroy();

        // 从 GameScene 的塔数组中移除
        this.scene.towers = this.scene.towers.filter(t => t !== tower);

        // 卖掉塔之后，必须重新计算路径并更新地图纹理！
        this.scene.pathSystem.recalculatePath();
        this.scene.updatePhaserPath();
        this.scene.updateMapTiles();

        // update the enemies' path to follow the new path
        this.scene.updateEnemiesPath();

        this.hideTowerMenu();
    }
}