// this file is used to manage all the towers in the game,
// it will be responsible for updating the towers, and also for creating new towers when the player buys them

import {getEnemyInRange} from '../utils/towerHelpers.js';
import {shoot} from '../utils/combatHelpers.js';

export class TowerSystem {
    // the constructor will take the scene as a parameter, and will store it in a variable
    constructor(scene) {
        this.scene = scene;
    }

    update(currentTime) {
        if (!this.scene || !this.scene.towers) return;

        this.scene.towers.forEach(tower => {
            if (!tower.active) return;

            // update the status effects on the enemies
            this.updateStatusEffects(currentTime);

            // initialize cooldown timers for the tower if they haven't been set yet
            if (!tower.isCooldownInitialized) {
                tower.nextFire = currentTime + 500;
                tower.nextGoldTime = currentTime + 2000;
                tower.nextHealTime = currentTime + 1000;
                tower.isCooldownInitialized = true;
            }

            // use a switch statement to handle different tower types, and call the corresponding method for each type
            switch (tower.type) {
                case 'fire':
                    this.handleFireTower(tower, currentTime);
                    break;
                case 'gold':
                    this.handleGoldTower(tower, currentTime);
                    break;
                case 'water':
                    this.handleWaterTower(tower, currentTime);
                    break;
                case 'wood': 
                    this.handleWoodTower(tower, currentTime); 
                    break;
                case 'earth': 
                    this.handleEarthTower(tower, currentTime); 
                    break;
            }
        });
    }

    // ============== tower handling methods ==============
    handleFireTower(tower, currentTime) {
        if (currentTime > tower.nextFire) {
            let target = getEnemyInRange(tower, this.scene.enemies.getChildren());
            if (target) {
                // 判断水塔 Buff 的逻辑也可以封装成一个辅助函数
                // let isBuffed = this.checkWaterBuff(tower); 
                shoot(this.scene, tower, target, this.scene.bullets);
                
                tower.nextFire = (currentTime - tower.nextFire > 500) ? currentTime + 500 : tower.nextFire + 500;
            }
        }
    }

    handleGoldTower(tower, currentTime) {
        if (currentTime > tower.nextGoldTime) {
            this.scene.playerMoney += 10;
            this.showFloatingText(tower.x, tower.y, '+10$', '#ffd700');
            this.scene.events.emit('updateMoney', this.scene.playerMoney);
            tower.nextGoldTime += 2000;
        }
    }

    handleWaterTower(tower, currentTime) {
        if (currentTime > tower.nextHealTime) {
            this.scene.towers.forEach(targetTower => {
                if (this.isInRange(tower, targetTower, 100)) {
                    if (targetTower.hp < targetTower.maxHp) {
                        targetTower.hp = Math.min(targetTower.hp + 25, targetTower.maxHp);
                        this.showFloatingText(targetTower.x, targetTower.y, '+25 HP', '#00ff00');
                    }
                }
            });
            tower.nextHealTime += 1000;
        }
    }

    handleWoodTower(tower, currentTime) {
        // 木塔的攻击频率可以慢一点（例如 800ms）
        if (currentTime > tower.nextFire) {
            let target = getEnemyInRange(tower, this.scene.enemies.getChildren());
            if (target) {
                // 注意：发射的子弹需要带上“我是木头子弹”的标记，待会儿在 GameScene 里教你怎么接
                shoot(this.scene, tower, target, this.scene.bullets, false); 
                
                tower.nextFire = currentTime + 800;
            }
        }
    }

    handleEarthTower(tower, currentTime) {
        // 土塔：每 3 秒发动一次地震，眩晕周围所有敌人
        if (currentTime > tower.nextFire) {
            let hitAny = false;
            
            this.scene.enemies.getChildren().forEach(enemy => {
                if (enemy.active && this.isInRange(tower, enemy, tower.range)) {
                    hitAny = true;
                    // 挂载眩晕状态
                    enemy.isStunned = true;
                    enemy.stunEndTime = currentTime + 1000; // 眩晕 1 秒
                    
                    // Phaser 中停止敌人沿路径移动的内置方法
                    if (enemy.pauseFollow) enemy.pauseFollow();
                    
                    this.showFloatingText(enemy.x, enemy.y, '💫 眩晕', '#e67e22');
                }
            });

            // 如果震到了人，进入 5 秒冷却；如果没震到人，2 秒后再侦测
            tower.nextFire = currentTime + (hitAny ? 5000 : 2000);
        }
    }

    // ============== helper methods ==============
    // helper method to check if a fire tower is within range of any active water tower, which would grant it a buff
    checkWaterBuff(tower) {
        return this.scene.towers.some(other => 
            other.type === 'water' && other.active && this.isInRange(tower, other, 100)
        );
    }

    // helper method: calculate distance
    isInRange(obj1, obj2, maxDistance) {
        let dx = Math.abs(obj1.x - obj2.x);
        let dy = Math.abs(obj1.y - obj2.y);
        return dx <= maxDistance && dy <= maxDistance;
    }

    // helper method: show floating text effect
    showFloatingText(x, y, text, color) {
        let floatText = this.scene.add.text(x - 10, y - 20, text, { 
            fontSize: '18px', fill: color, fontStyle: 'bold' 
        });
        this.scene.tweens.add({
            targets: floatText, y: y - 50, alpha: 0, duration: 1000,
            onComplete: () => floatText.destroy()
        });
    }

    updateStatusEffects(currentTime) {
        this.scene.enemies.getChildren().forEach(enemy => {
            if (!enemy.active) return;

            // 1. 结算眩晕 (Stun)
            if (enemy.isStunned && currentTime > enemy.stunEndTime) {
                enemy.isStunned = false;
                if (enemy.resumeFollow) enemy.resumeFollow(); // 恢复移动
            }

            // 2. 结算减速 (Slow)
            if (enemy.isSlowed) {
                if (currentTime > enemy.slowEndTime) {
                    enemy.isSlowed = false;
                    // 恢复正常速度 (Phaser follower 的速度由 pathTween 的 timeScale 控制)
                    if (enemy.pathTween) enemy.pathTween.timeScale = 1; 
                } else if (!enemy.isStunned) {
                    // 如果没被眩晕，且处于减速状态，速度减半
                    if (enemy.pathTween) enemy.pathTween.timeScale = 0.5;
                }
            }

            // 3. 结算中毒 (Poison DoT)
            if (enemy.isPoisoned) {
                if (currentTime > enemy.poisonEndTime) {
                    enemy.isPoisoned = false;
                } else if (currentTime > enemy.nextPoisonTick) {
                    let poisonDmg = 15; // 每次毒发伤害
                    enemy.hp -= poisonDmg;
                    this.showFloatingText(enemy.x, enemy.y, '-' + poisonDmg, '#8e44ad');
                    
                    if (enemy.hp <= 0) {
                        enemy.destroy();
                        this.scene.playerMoney += 10;
                        this.scene.events.emit('updateMoney', this.scene.playerMoney);
                    } else {
                        enemy.nextPoisonTick = currentTime + 500; // 每 0.5 秒扣一次血
                    }
                }
            }
        });
    }
}