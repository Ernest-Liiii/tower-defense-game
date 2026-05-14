// this file is used to manage all the towers in the game,
// it will be responsible for updating the towers, and also for creating new towers when the player buys them

import {getEnemyInRange, getMultipleEnemiesInRange} from '../utils/towerHelpers.js';
import {shoot} from '../utils/combatHelpers.js';

export class TowerSystem {
    // the constructor will take the scene as a parameter, and will store it in a variable
    constructor(scene) {
        this.scene = scene;
    }

    update(currentTime) {
        if (!this.scene || !this.scene.towers) return;

        if (this.scene.waveSystem && this.scene.waveSystem.isPreparationPhase) {
            return; 
        }

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

        if (tower.isSealed) {
            if (currentTime >= tower.sealEndTime) {
                tower.isSealed = false;
                tower.clearTint(); 
                
                // 解封时，销毁封印特效，恢复自身待机特效
                if (tower.sealEmitter) {
                    tower.sealEmitter.destroy();
                    tower.sealEmitter = null;
                }
                if (tower.emitter) tower.emitter.resume();

            } else {
                return; // 还在封印中，直接 return 罢工！什么都不做！
            }
        }

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

        if (tower.isSealed) {
            if (currentTime >= tower.sealEndTime) {
                tower.isSealed = false;
                tower.clearTint(); 
                
                // 解封时，销毁封印特效，恢复自身待机特效
                if (tower.sealEmitter) {
                    tower.sealEmitter.destroy();
                    tower.sealEmitter = null;
                }
                if (tower.emitter) tower.emitter.resume();
                
            } else {
                return; // 还在封印中，直接 return 罢工！什么都不做！
            }
        }

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

            // 增加金塔产出金钱时的视觉特效
            let coinBurst = this.scene.add.particles(tower.x, tower.y - 10, 'gold_glint', {
                speed: { min: 40, max: 90 },
                angle: { min: 220, max: 320 }, // 向上方呈扇形喷发
                gravityY: 200,                 // 【核心】加上重力参数！让闪光喷上去后往下掉！
                scale: { start: 1, end: 0 },
                alpha: { start: 1, end: 0 },
                lifespan: { min: 600, max: 900 },
                blendMode: 'ADD',
                emitting: false                // 设为单次爆发，不持续喷发
            });
                
            coinBurst.setDepth(15);
            coinBurst.explode(5); // 瞬间喷出 5 个十字金光！

            // 爆发结束后销毁发射器
            this.scene.time.delayedCall(1000, () => {
                if (coinBurst) coinBurst.destroy();
            });

            tower.nextGoldTime = currentTime + 2000;
        }
    }

    handleWaterTower(tower, currentTime) {

        if (tower.isSealed) {
            if (currentTime >= tower.sealEndTime) {
                tower.isSealed = false;
                tower.clearTint(); // 封印结束，恢复原有颜色
                // 解封时，销毁封印特效，恢复自身待机特效
                if (tower.sealEmitter) {
                    tower.sealEmitter.destroy();
                    tower.sealEmitter = null;
                }
                if (tower.emitter) tower.emitter.resume();

            } else {
                return; // 还在封印中，直接 return 罢工！什么都不做！
            }
        }

        if (currentTime > tower.nextHealTime) {
            let healAmt = tower.healAmount || 25;
            let sMax = tower.shieldMax || 50;
            let hRange = tower.healRange || 100;

            this.scene.towers.forEach(targetTower => {
                if (this.isInRange(tower, targetTower, hRange)) {
                    if (targetTower.hp < targetTower.maxHp) {
                        targetTower.hp = Math.min(targetTower.hp + healAmt, targetTower.maxHp);
                        this.showFloatingText(targetTower.x, targetTower.y, `+${healAmt} HP`, '#00ff00');

                        let waterPulse = this.scene.add.particles(tower.x, tower.y - 10, 'water_bubble', {
                            speed: { min: 30, max: 60 },      // 像波纹一样向外柔和地推开
                            angle: { min: 0, max: 360 },      // 360度全方位扩散
                            scale: { start: 0.8, end: 0 },    // 水泡慢慢缩小直至消失
                            alpha: { start: 0.6, end: 0 },    // 保持半透明，体现水的柔和感
                            blendMode: 'ADD',
                            lifespan: 600,                    // 扩散过程比较缓慢柔和 (0.6秒)
                            emitting: false                   // 单次爆发
                        });
                        
                        waterPulse.setDepth(1); // 层级设为1，紧贴地面扩散，不会遮挡塔身
                        waterPulse.explode(20); // 瞬间向四周荡出 20 个水泡！

                        // 爆发结束后销毁发射器
                        this.scene.time.delayedCall(800, () => {
                            if (waterPulse) waterPulse.destroy();
                        });
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
            tower.nextHealTime = currentTime + 1000;
        }
    }

    handleWoodTower(tower, currentTime) {
        let cd = tower.cooldown || 800;

        if (tower.isSealed) {
            if (currentTime >= tower.sealEndTime) {
                tower.isSealed = false;
                tower.clearTint(); // 封印结束，恢复原有颜色
                // 解封时，销毁封印特效，恢复自身待机特效
                if (tower.sealEmitter) {
                    tower.sealEmitter.destroy();
                    tower.sealEmitter = null;
                }
                if (tower.emitter) tower.emitter.resume();

            } else {
                return; // 还在封印中，直接 return 罢工！什么都不做！
            }
        }

        // Wood tower attack frequency is slower (e.g., 800ms)
        if (currentTime > tower.nextFire) {
            // 升级木塔 让他现在可以最多攻击3个敌人
            let targets = getMultipleEnemiesInRange(tower, this.scene.enemies.getChildren(), 3);

            if (targets && targets.length > 0) {

                targets.forEach(target => {
                    let bullet = shoot(this.scene, tower, target, this.scene.bullets, false); 
                    
                    if (bullet) {
                        bullet.towerType = 'wood';
                        // Water -> Wood 联动：水塔 Buff 会赋予超级毒素
                        bullet.isSuperPoison = tower.isWaterBuffed; 
                    }
                });

                let cooldown = tower.isWaterBuffed? cd * 0.7: cd;
                tower.nextFire = currentTime + cooldown;
            }
        }
    }

    handleEarthTower(tower, currentTime) {
        let stunDur = tower.stunDuration || 1000;
        let baseCd = tower.baseCooldown || 5000;

        if (tower.isSealed) {
            if (currentTime >= tower.sealEndTime) {
                tower.isSealed = false;
                tower.clearTint(); // 封印结束，恢复原有颜色
                // 解封时，销毁封印特效，恢复自身待机特效
                if (tower.sealEmitter) {
                    tower.sealEmitter.destroy();
                    tower.sealEmitter = null;
                }
                if (tower.emitter) tower.emitter.resume();

            } else {
                return; // 还在封印中，直接 return 罢工！什么都不做！
            }
        }

        // Earth tower: triggers earthquake every 3 seconds, stuns all nearby enemies
        if (currentTime > tower.nextFire) {
            let hitAny = false;
            
            this.scene.enemies.getChildren().forEach(enemy => {
                // boss二阶段免疫眩晕
                if (enemy.currentImmunity === 'earth') {
                    if (enemy.active && this.isInRange(tower, enemy, tower.range)) {
                        // 如果 Boss 走进了土塔范围，但免疫眩晕，每秒只飘一次 IMMUNE 字样，防止满屏都是字
                        if (currentTime > (enemy.lastEarthImmuneText || 0)) {
                            this.showFloatingText(enemy.x, enemy.y, 'IMMUNE', '#cccccc');
                            enemy.lastEarthImmuneText = currentTime + 1000;
                        }
                    }
                    return; // 跳过后续的眩晕挂载
                }

                if (enemy.active && this.isInRange(tower, enemy, tower.range)) {
                    hitAny = true;
                    // Apply stun status
                    enemy.isStunned = true;
                    enemy.stunEndTime = currentTime + stunDur; // Stun for 1 second
                    
                    // Built-in Phaser method to stop enemy path following
                    if (enemy.pauseFollow) enemy.pauseFollow();
                    
                    this.showFloatingText(enemy.x, enemy.y, '💫', '#e67e22');

                    let shockwave = this.scene.add.particles(tower.x, tower.y - 10, 'earth_dust', {
                        speed: { min: 80, max: 150 },     // 极快的向外爆发速度
                        angle: { min: 0, max: 360 },      // 【关键】360度全方位死角喷发，形成环形
                        scale: { start: 3, end: 0 },    // 碎石变大，然后迅速散去
                        alpha: { start: 0.9, end: 0 },
                        lifespan: 400,                    // 冲击波转瞬即逝 (0.4秒)
                        rotate: { start: 0, end: 360 },   // 爆发时碎石狂野翻滚
                        emitting: false                   // 单次爆发
                    });
                    
                    shockwave.setDepth(1); // 【关键】层级设为 1，在草地上面，但是在塔和怪物下面，营造“贴地冲击”的感觉
                    shockwave.explode(30); // 瞬间向四周炸出 30 颗碎石！

                    // 爆发结束后销毁发射器
                    this.scene.time.delayedCall(500, () => {
                        if (shockwave) shockwave.destroy();
                    });
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

                        if (enemy.shieldEmitter) enemy.shieldEmitter.destroy();

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