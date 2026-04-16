export class EnemyAttackSystem {
    constructor(scene) {
        // Save reference to main scene to access this.scene.enemies, this.scene.towers, etc.
        this.scene = scene; 
    }

    update(currentTime) {
        // Sanity check: if scene, enemies, or towers don't exist, skip
        if (!this.scene || !this.scene.enemies || !this.scene.towers) return;

        this.scene.enemies.getChildren().forEach(enemy => {
            // If enemy is alive and attack cooldown is ready
            if (enemy.active && currentTime > enemy.nextAttack) {
                
                let targetTower = null;
                let minDistance = enemy.attackRange; // Default attack range
                
                // Iterate through all active towers to find attack target
                this.scene.towers.forEach(towerItem => {
                    if (towerItem.active) {
                        let distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, towerItem.x, towerItem.y);
                        if (distance <= minDistance) {
                            targetTower = towerItem;
                            minDistance = distance;
                        }
                    }
                });

                // If target found, execute attack
                if (targetTower) {
                    targetTower.hp -= enemy.damage;
                    
                    // Show red floating damage text
                    let dmgText = this.scene.add.text(targetTower.x, targetTower.y, '-' + enemy.damage, { fill: '#ff0000', fontStyle: 'bold' });
                    this.scene.tweens.add({ targets: dmgText, y: targetTower.y - 30, alpha: 0, duration: 800, onComplete: () => dmgText.destroy() });
                    
                    // If tower HP drops to zero, tower is destroyed!
                    if (targetTower.hp <= 0) {
                        targetTower.destroy(); // Destroy tower image
                        targetTower.active = false; 

                        this.scene.towers = this.scene.towers.filter(t => t !== targetTower);
                        
                        // If tower is destroyed, previously blocked path may open
                        // You can call scene method to recalculate enemy path:
                        if (this.scene.updateEnemiesPath) {
                            this.scene.pathSystem.recalculatePath();
                            this.scene.updatePhaserPath();
                            this.scene.updateMapTiles();
                            this.scene.updateEnemiesPath();
                        }
                    }
                    
                    // Reset enemy attack cooldown
                    if (currentTime - enemy.nextAttack > enemy.attackCooldown) {
                        enemy.nextAttack = currentTime + enemy.attackCooldown;
                    } else {
                        enemy.nextAttack += enemy.attackCooldown;
                    }
                }
            }
        });
        
        // Clean up invalid towers: remove destroyed towers from scene management array
        this.scene.towers = this.scene.towers.filter(t => t.active);
    }
}