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

            // ✅ 【New】Handle click logic for existing objects
            if (gameObjects.length > 0) {
                let clickedObj = gameObjects[0];
                
                // If clicking on upgrade/sell button, return and let button handle its own event
                if (clickedObj.isMenuBtn) return; 

                // If clicking on already-built tower, show popup menu
                if (clickedObj.isBuiltTower) {
                    this.showTowerMenu(clickedObj);
                    return; 
                }

                // If clicking on right side UI panel or other objects, hide menu and exit
                this.hideTowerMenu();
                return; 
            }

            // ✅ Clicked on empty space, hide menu first, then continue with build logic
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
                let warning = this.scene.add.text(pointer.x, pointer.y - 20, 'Cannot build on waypoint!', { fill: '#ff0000', fontStyle: 'bold' });
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
                    // Calculate distance from enemy to cell center
                    let dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, centerX, centerY);
                    // If distance is less than half cell size (20), enemy is on this cell
                    if (dist < 20) isEnemyOnTile = true;
                });
            }
            if (isEnemyOnTile) {
                let warning = this.scene.add.text(pointer.x, pointer.y - 20, 'Cannot build on enemy!', { fill: '#ff0000', fontStyle: 'bold' });
                this.scene.time.delayedCall(1000, () => warning.destroy());
                return;
            }

            // 3. use this.scene.currentSelectedTower to detect the cost
            let towerConfig = TOWER_DATA[this.scene.currentSelectedTower];
            if (this.scene.playerMoney < towerConfig.cost) {
                let warning = this.scene.add.text(pointer.x, pointer.y - 20, 'Insufficient funds!', { fill: '#ff0000' });
                this.scene.time.delayedCall(1000, () => warning.destroy());
                return;
            }

            // Get ready to drag
            this.isDragging = true;
            this.dragStartX = pointer.x;
            this.dragStartY = pointer.y;
            this.currentDragDir = 'up'; 

            let textureName = this.scene.currentSelectedTower + '_tower'; // e.g. 'wood' + '_tower' = 'wood_tower'
            this.previewTower = this.scene.add.image(centerX, centerY, textureName);
            this.previewTower.setDisplaySize(this.scene.cellSize, this.scene.cellSize);

            this.previewTower.alpha = 0.5; 
            this.previewRange = this.scene.add.graphics();
            drawDirectionalRange(this.previewRange, centerX, centerY, this.currentDragDir, this.scene.currentSelectedTower, towerConfig.range);
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

            let towerConfig = TOWER_DATA[this.scene.currentSelectedTower];
            drawDirectionalRange(this.previewRange, this.previewTower.x, this.previewTower.y, this.currentDragDir, this.scene.currentSelectedTower, towerConfig.range);
        });

        // ================= Stage 3: release the mouse =================
        this.scene.input.on('pointerup', (pointer) => {
            if (!this.isDragging) return;
            
            let towerConfig = TOWER_DATA[this.scene.currentSelectedTower];
            let centerX = this.previewTower.x;
            let centerY = this.previewTower.y;

            // 【Core New】1. First add a "fake tower" to test
            let mockTower = { x: centerX, y: centerY, active: true };
            this.scene.towers.push(mockTower);

            // 【Core New】2. Test if pathfinding system can find a path
            let pathExists = this.scene.pathSystem.recalculatePath();

            // 【Core New】3. Remove the fake tower
            this.scene.towers.pop();

            // 【Core New】4. If path is completely blocked, refuse to build!
            if (!pathExists) {
                this.scene.pathSystem.recalculatePath(); // Restore original path
                let warning = this.scene.add.text(centerX, centerY - 20, 'Cannot completely block the path!', { fill: '#ff0000', fontStyle: 'bold' });
                this.scene.time.delayedCall(1000, () => warning.destroy());
                
                // Cancel dragging state
                this.isDragging = false;
                this.previewTower.destroy();
                this.previewRange.destroy();
                this.previewTower = null;
                this.previewRange = null;
                return; // Exit without deducting cost or building tower
            }

            // Deduct costs and update the UI
            this.isDragging = false;
            this.scene.playerMoney -= towerConfig.cost;
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
                let textureName = this.scene.currentSelectedTower + '_tower';
                tower = this.scene.add.image(centerX, centerY, textureName);
                tower.setDisplaySize(this.scene.cellSize, this.scene.cellSize);

                tower.rangeGraphic = this.scene.add.graphics();
                drawDirectionalRange(tower.rangeGraphic, centerX, centerY, this.currentDragDir, this.scene.currentSelectedTower, towerConfig.range, 0.15);
            }

            tower.type = this.scene.currentSelectedTower;
            tower.hp = towerConfig.hp;
            tower.maxHp = towerConfig.hp;
            tower.damage = towerConfig.damage;
            tower.nextFire = 0;
            tower.range = towerConfig.range;

            tower.active = true;

            tower.setInteractive();     // Make tower clickable
            tower.isBuiltTower = true;  // Mark as built tower for identification
            tower.level = 1;            // Initial level
            tower.cost = towerConfig.cost; // Record cost for calculating upgrade and sell prices

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
        this.hideTowerMenu(); // Hide any other open menus first

        // Create a container for buttons, place above tower
        this.towerMenu = this.scene.add.container(tower.x, tower.y - 40);
        this.towerMenu.setDepth(200);

        // Calculate upgrade cost and sell price
        let upgradeCost = tower.cost; // Assume upgrade cost equals build cost
        let sellPrice = Math.floor(tower.cost * 0.5); // Sell for 50% refund

        // 1. Upgrade button (blue)
        let upgBtn = this.scene.add.text(2, -20, `⬆️ Upgrade($${upgradeCost})`, { 
            fontSize: '12px', fill: '#fff', backgroundColor: '#0984e3', padding: {x:4, y:4} 
        }).setInteractive().setOrigin(0, 0.5);
        upgBtn.isMenuBtn = true; // Mark to prevent triggering build

        upgBtn.on('pointerdown', () => this.upgradeTower(tower, upgradeCost));

        // If max level (e.g., level 3) or not enough money, button becomes gray
        if (tower.level >= 3) {
            upgBtn.setText('MAX');
            upgBtn.setStyle({ backgroundColor: '#636e72' });
            upgBtn.disableInteractive();
        } else if (this.scene.playerMoney < upgradeCost) {
            upgBtn.setStyle({ backgroundColor: '#636e72' });
        }

        // 2. Sell button (red)
        let sellBtn = this.scene.add.text(-2, -20, `💰 Sell(+$${sellPrice})`, { 
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
            // Deduct cost
            this.scene.playerMoney -= cost;
            this.scene.events.emit('updateMoney', this.scene.playerMoney);

            // Upgrade stats (simple: increase damage by 50%, or add effect for gold/water towers)
            tower.level++;
            tower.damage = Math.floor(tower.damage * 1.5);
            tower.maxHp += 50;
            tower.hp += 50;
            
            // Visual feedback: increase scale slightly or add aura
            tower.scale += 0.1; 
            
            // Floating text indicator
            let upgText = this.scene.add.text(tower.x, tower.y - 20, 'Level UP!', { fill: '#00ff00', fontStyle: 'bold' }).setOrigin(0.5);
            this.scene.tweens.add({ targets: upgText, y: tower.y - 50, alpha: 0, duration: 1000, onComplete: () => upgText.destroy() });

            this.hideTowerMenu();
        } else {
            // Insufficient funds warning
            let warning = this.scene.add.text(tower.x, tower.y - 20, 'Insufficient funds!', { fill: '#ff0000' }).setOrigin(0.5);
            this.scene.time.delayedCall(1000, () => warning.destroy());
        }
    }

    sellTower(tower, price) {
        // Add money
        this.scene.playerMoney += price;
        this.scene.events.emit('updateMoney', this.scene.playerMoney);

        // Destroy bound attack range indicator
        if (tower.rangeGraphic) {
            tower.rangeGraphic.destroy();
        }

        // Completely destroy tower
        tower.active = false;
        tower.destroy();

        // Remove from GameScene tower array
        this.scene.towers = this.scene.towers.filter(t => t !== tower);

        // After selling tower, must recalculate path and update map tiles!
        this.scene.pathSystem.recalculatePath();
        this.scene.updatePhaserPath();
        this.scene.updateMapTiles();

        // Update enemies' path to follow new path
        this.scene.updateEnemiesPath();

        this.hideTowerMenu();
    }
}