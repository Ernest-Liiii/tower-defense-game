// this file is used to control how enemies can attack my tower

export class EnemyAttackSystem {
    constructor(scene) {
        // 保存对主场景的引用，以便访问 this.scene.enemies, this.scene.towers 等
        this.scene = scene; 
    }

    update(currentTime) {
        // 防呆检查：如果场景、敌人组或塔数组不存在，直接跳过
        if (!this.scene || !this.scene.enemies || !this.scene.towers) return;

        this.scene.enemies.getChildren().forEach(enemy => {
            // 如果敌人还活着，并且攻击冷却好了
            if (enemy.active && currentTime > enemy.nextAttack) {
                
                let targetTower = null;
                let minDistance = enemy.attackRange; // 默认攻击范围
                
                // 遍历所有存活的塔，寻找攻击目标
                this.scene.towers.forEach(towerItem => {
                    if (towerItem.active) {
                        let distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, towerItem.x, towerItem.y);
                        if (distance <= minDistance) {
                            targetTower = towerItem;
                            minDistance = distance;
                        }
                    }
                });

                // 如果找到目标，执行攻击
                if (targetTower) {
                    targetTower.hp -= enemy.damage;
                    
                    // 飘红字显示塔掉血了
                    let dmgText = this.scene.add.text(targetTower.x, targetTower.y, '-' + enemy.damage, { fill: '#ff0000', fontStyle: 'bold' });
                    this.scene.tweens.add({ targets: dmgText, y: targetTower.y - 30, alpha: 0, duration: 800, onComplete: () => dmgText.destroy() });
                    
                    // 如果塔的血量归零，塔就被拆毁了！
                    if (targetTower.hp <= 0) {
                        targetTower.destroy(); // 销毁塔的图像
                        targetTower.active = false; 

                        this.scene.towers = this.scene.towers.filter(t => t !== targetTower);
                        
                        // 【优化建议】如果塔被摧毁，原来被挡住的路可能通了，
                        // 你可以调用场景的方法重新计算敌人的路径：
                        if (this.scene.updateEnemiesPath) {
                            this.scene.pathSystem.recalculatePath();
                            this.scene.updatePhaserPath();
                            this.scene.updateMapTiles();
                            this.scene.updateEnemiesPath();
                        }
                    }
                    
                    // 重置敌人的攻击冷却时间
                    if (currentTime - enemy.nextAttack > enemy.attackCooldown) {
                        enemy.nextAttack = currentTime + enemy.attackCooldown;
                    } else {
                        enemy.nextAttack += enemy.attackCooldown;
                    }
                }
            }
        });
        
        // 【清理无效的塔】把已经被拆掉的塔从主场景的管理数组里踢出去
        this.scene.towers = this.scene.towers.filter(t => t.active);
    }
}