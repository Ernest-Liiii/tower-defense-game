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

            if (tower.shield && tower.shield > 0) {
                // if exceed 2500 ms, then shield become 0
                if (currentTime - (tower.lastShieldTime || 0) > 2500) {
                    tower.shield = 0;
                }
            }

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
        let cd = tower.cooldown || 500;

        if (currentTime > tower.nextFire) {
            let target = getEnemyInRange(tower, this.scene.enemies.getChildren());
            if (target) {
                // Water tower buff logic could be encapsulated into helper function too
                // let isBuffed = this.checkWaterBuff(tower); 
                shoot(this.scene, tower, target, this.scene.bullets);
                
                tower.nextFire = (currentTime - tower.nextFire > cd) ? currentTime + cd : tower.nextFire + cd;
            }
        }
    }

    handleGoldTower(tower, currentTime) {
        if (currentTime > tower.nextGoldTime) {
            // if gold tower is in earth tower range, increase the gold production amount.
            // Earth -> Gold
            let baseG = tower.baseGold || 10;
            let buffedG = tower.buffedGold || 20;

            let goldAmount = tower.isEarthBuffed ? buffedG : baseG;
            this.scene.playerMoney += goldAmount;

            let color = tower.isEarthBuffed? '#FFAA00': '#FFD700';

            this.showFloatingText(tower.x, tower.y, `+${goldAmount}$`, color);

            this.scene.events.emit('updateMoney', this.scene.playerMoney);
            tower.nextGoldTime += 2000;
        }
    }

    handleWaterTower(tower, currentTime) {
        if (currentTime > tower.nextHealTime) {
            let healAmt = tower.healAmount || 25;
            let sMax = tower.shieldMax || 50;
            let hRange = tower.healRange || 100;

            this.scene.towers.forEach(targetTower => {
                if (this.isInRange(tower, targetTower, hRange)) {
                    if (targetTower.hp < targetTower.maxHp) {
                        targetTower.hp = Math.min(targetTower.hp + healAmt, targetTower.maxHp);
                        this.showFloatingText(targetTower.x, targetTower.y, `+${healAmt} HP`, '#00ff00');
                    }
                }

                // Gold -> Water
                if (tower.isGoldBuffed) {
                    if (!targetTower.shield) targetTower.shield = 0;  // initialize

                    if (targetTower.shield < sMax) {
                        let oldShield = targetTower.shield;
                        targetTower.shield = Math.min(targetTower.shield + (sMax * 0.4), sMax);

                        let added = Math.round(targetTower.shield - oldShield);
                        if (added > 0) {
                            this.showFloatingText(targetTower.x, targetTower.y - 15, `+${added} Shield`, '#FFFFFF');
                        }
                    }

                    targetTower.lastShieldTime = currentTime;
                }
            });
            tower.nextHealTime += 1000;
        }
    }

    handleWoodTower(tower, currentTime) {
        let cd = tower.cooldown || 800;

        // Wood tower attack frequency is slower (e.g., 800ms)
        if (currentTime > tower.nextFire) {
            let target = getEnemyInRange(tower, this.scene.enemies.getChildren());
            if (target) {

                let bullet = shoot(this.scene, tower, target, this.scene.bullets, false); 
                // Water -> Wood
                if (bullet) {
                    bullet.towerType = 'wood';
                    bullet.isSuperPoison = tower.isWaterBuffed;
                }
                
                let cooldown = tower.isWaterBuffed? cd * 0.7: cd;
                tower.nextFire = currentTime + cooldown;
            }
        }
    }

    handleEarthTower(tower, currentTime) {
        let stunDur = tower.stunDuration || 1000;
        let baseCd = tower.baseCooldown || 5000;

        // Earth tower: triggers earthquake every 3 seconds, stuns all nearby enemies
        if (currentTime > tower.nextFire) {
            let hitAny = false;
            
            this.scene.enemies.getChildren().forEach(enemy => {
                if (enemy.active && this.isInRange(tower, enemy, tower.range)) {
                    hitAny = true;
                    // Apply stun status
                    enemy.isStunned = true;
                    enemy.stunEndTime = currentTime + stunDur; // Stun for 1 second
                    
                    // Built-in Phaser method to stop enemy path following
                    if (enemy.pauseFollow) enemy.pauseFollow();
                    
                    this.showFloatingText(enemy.x, enemy.y, '💫 Stunned', '#e67e22');
                }
            });

            // If hit any enemies, 5 second cooldown; if not, check again in 2 seconds
            // Fire -> Earth
            let buffedCd = baseCd * 0.6; 
            let cooldown = tower.isFireBuffed ? buffedCd : baseCd;
            tower.nextFire = currentTime + (hitAny ? cooldown : 2000);
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

            // 1. Resolve Stun status
            if (enemy.isStunned && currentTime > enemy.stunEndTime) {
                enemy.isStunned = false;
                if (enemy.resumeFollow) enemy.resumeFollow(); // Resume movement
            }

            // 2. Resolve Slow status
            if (enemy.isSlowed) {
                if (currentTime > enemy.slowEndTime) {
                    enemy.isSlowed = false;
                    // Restore normal speed (Phaser follower speed controlled by pathTween timeScale)
                    if (enemy.pathTween) enemy.pathTween.timeScale = 1; 
                } else if (!enemy.isStunned) {
                    // If not stunned and slowed, reduce speed to half
                    if (enemy.pathTween) enemy.pathTween.timeScale = 0.5;
                }
            }

            // 3. Resolve Poison DoT (Damage over Time)
            if (enemy.isPoisoned) {
                if (currentTime > enemy.poisonEndTime) {
                    enemy.isPoisoned = false;
                } else if (currentTime > enemy.nextPoisonTick) {
                    let poisonDmg = enemy.isSuperPoison? 30: 15; // Poison damage per tick
                    enemy.hp -= poisonDmg;
                    this.showFloatingText(enemy.x, enemy.y, '-' + poisonDmg, '#8e44ad');
                    
                    if (enemy.hp <= 0) {
                        enemy.destroy();
                        this.scene.playerMoney += 10;
                        this.scene.events.emit('updateMoney', this.scene.playerMoney);
                    } else {
                        enemy.nextPoisonTick = currentTime + 500; // Damage every 0.5 seconds
                    }
                }
            }
        });
    }
}