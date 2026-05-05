// this file is used to control how my tower can attack the enemies
export class ReactionSystem {
    constructor(scene) {
        // initialize the system
        this.scene = scene;
        this.nextCheckTime = 0;
    }

    update(currentTime) {
        // add the update function
        if (!this.scene.towers) return;  // no tower situation 
        if (currentTime < this.nextCheckTime) return;  // no reach the next check time

        // clear all tower's buff
        this.scene.towers.forEach(t => {
            t.isWaterBuffed = false;
            t.isWoodBuffed = false;
            t.isFireBuffed = false;
            t.isEarthBuffed = false;
            t.isGoldBuffed = false;
        })

        // loop all tower, if it is provider then find the recevier
        this.scene.towers.forEach(provider => {
            if (!provider.active) return;

            if (provider.type === 'water') {
                this.applyBuff(provider, 'wood', 'isWaterBuffed', 100);  // hard code for range, I will applyBuff function will be defined later
            }
            else if (provider.type === 'wood') {
                this.applyBuff(provider, 'fire', 'isWoodBuffed', provider.range);
            }
            else if (provider.type === 'fire') {
                this.applyBuff(provider, 'earth', 'isFireBuffed', 100);  // hard code for range
            }
            else if (provider.type === 'earth') {
                this.applyBuff(provider, 'gold', 'isEarthBuffed', provider.range);
            }
            else if (provider.type === 'gold') {
                this.applyBuff(provider, 'water', 'isGoldBuffed', 100);  // hard code for range
            }
        })

        this.nextCheckTime = currentTime + 500;  // scan it once per 0.5 second
    }

    applyBuff(provider, targetType, buffFlag, radius) {
        this.scene.towers.forEach(receiver => {
            if (receiver !== provider && receiver.type === targetType && receiver.active) {
                let inRange = false;

                if (provider.type === 'fire') {
                    let cx = provider.x, cy = provider.y;
                    let minX, maxX, minY, maxY;

                    if (provider.direction === 'up') {
                        minX = cx - 60;
                        maxX = cx + 60;
                        minY = cy - 100;
                        maxY = cy + 20;
                    }
                    else if (provider.direction === 'down') {
                        minX = cx - 60; 
                        maxX = cx + 60; 
                        minY = cy - 20; 
                        maxY = cy + 100;
                    }
                    else if (provider.direction === 'left') {
                        minX = cx - 100; 
                        maxX = cx + 20; 
                        minY = cy - 60; 
                        maxY = cy + 60;
                    }
                    else if (provider.direction === 'right') {
                        minX = cx - 20; 
                        maxX = cx + 100; 
                        minY = cy - 60; 
                        maxY = cy + 60;
                    }

                    if (receiver.x >= minX && receiver.x <= maxX && receiver.y >= minY && receiver.y <= maxY) {
                        inRange = true;
                    }

                    if (!inRange && provider.isWoodBuffed) {
                        let dist = Phaser.Math.Distance.Between(provider.x, provider.y, receiver.x, receiver.y);
                        if (dist <= 100) {
                            inRange = true
                        }
                    }
                }
                else if (provider.type === 'water') {
                    let dx = Math.abs(provider.x - receiver.x);
                    let dy = Math.abs(provider.y - receiver.y);

                    if (dx <= radius && dy <= radius) {
                        inRange = true;
                    }
                }
                else if (provider.type === 'gold') {
                    inRange = true;
                }
                else {
                    let dist = Phaser.Math.Distance.Between(provider.x, provider.y, receiver.x, receiver.y);

                    if (dist <= radius) {
                        inRange = true;
                    }
                }

                if (inRange) {
                    receiver[buffFlag] = true;
                }
            }
        })
    }
}