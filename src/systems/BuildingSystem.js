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
            if (gameObjects.length > 0) return; // exit when tap the UI

            const gridX = Math.floor(pointer.x / this.scene.cellSize) * this.scene.cellSize;
            const gridY = Math.floor(pointer.y / this.scene.cellSize) * this.scene.cellSize;
            const centerX = gridX + this.scene.cellSize / 2;
            const centerY = gridY + this.scene.cellSize / 2;

            // 1. Path collision detection
            // TODO: I need to adjust later...
            // let isOnPath = false;
            // if (centerY === 100 && centerX <= 580) isOnPath = true; 
            // else if (centerX === 580 && centerY >= 100 && centerY <= 380) isOnPath = true; 
            // else if (centerY === 380 && centerX >= 220 && centerX <= 580) isOnPath = true; 
            // else if (centerX === 220 && centerY >= 380 && centerY <= 600) isOnPath = true; 
            // if(isOnPath) return; 
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
                drawDirectionalRange(this.scene.add.graphics(), centerX, centerY, this.currentDragDir, 'fire', 0.15);
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

            if (tower.type === 'gold') tower.nextGoldTime = 0;
            if (tower.type === 'water') {
                tower.nextHealTime = 0;
                this.scene.add.rectangle(centerX, centerY, 200, 200, 0x3498db, 0.15);
            }

            // Add the tower to the tower array in GameScene
            this.scene.towers.push(tower);

            // recalculate the path and update to phaser
            this.scene.pathSystem.recalculatePath();

            // update the path in phaser
            this.scene.updatePhaserPath();

            // update the map tiles for the paths
            this.scene.updateMapTiles();

            // clean preview
            this.previewTower.destroy();
            this.previewRange.destroy();
            this.previewTower = null;
            this.previewRange = null;
        });
    }
}