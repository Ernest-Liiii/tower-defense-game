// this is a file to store helper functions related to combat, 
// such as calculating damage, checking for enemy in range, etc.

// this is a function to handle shooting logic when a tower shoots at an enemy
export function shoot(scene, tower, target, bullets, isBuffed = false) {
    // judging whether the bullet should be buffed based on whether the tower is currently buffed by a water tower
    let textureToUse = isBuffed ? 'boilingBulletTexture' : 'bulletTexture';
    
    let bullet = bullets.create(tower.x, tower.y, textureToUse);

    bullet.setDepth(1); // Set bullet depth to 1, so it appears above towers (depth 0) but below UI (depth 2)

    // 增加火塔子弹的飞行拖尾特效
    if (tower.type === 'fire') {
        let trailEmitter = scene.add.particles(0, 0, 'spark', {
            // 【核心修改 1】速度改为 0！让粒子生成后绝对静止在原地，防止向外乱散，形成一条极度笔直的线
            speed: 0,                        
            
            // 【核心修改 2】初始大小设为 1，让它和子弹完美衔接，慢慢收边变成尖锐的尾巴
            scale: { start: 1, end: 0 },     
            alpha: { start: 0.9, end: 0 },   
            blendMode: 'ADD',
            
            // 寿命增加到 350！这样尾巴才够长，看起来像彗星
            lifespan: 350,                   
            
            // 喷发频率极速提升到 10！彻底消除“虚线感”，让粒子无缝交叠成一条实线
            frequency: 10                    
        });

        trailEmitter.setDepth(bullet.depth - 1); 

        // 让发射器自动跟随这发子弹
        trailEmitter.startFollow(bullet);

        // 把发射器挂载在子弹上
        bullet.trailEmitter = trailEmitter;
    }

    // 增加木塔的子弹的飞行拖尾特效
    if (tower.type === 'wood') {
        let trailEmitter = scene.add.particles(0, 0, 'poison_spore', {
            speed: { min: -15, max: 15 },     // 【关键】和火塔的 speed: 0 不同，毒气要微微向外扩散
            scale: { start: 0.8, end: 0 },
            alpha: { start: 0.5, end: 0 },    // 半透明
            blendMode: 'ADD',
            lifespan: 300,                    // 寿命稍短一点
            frequency: 15                     // 喷发密集，形成连续的毒气带
        });

        trailEmitter.setDepth(bullet.depth - 1);
        trailEmitter.startFollow(bullet);
        bullet.trailEmitter = trailEmitter;
    }
    
    // if the bullet is buffed, it will have 50% more damage than normal
    bullet.damage = isBuffed ? tower.damage * 1.5 : tower.damage; 
    bullet.target = target; 

    bullet.towerType = tower.type; // Record tower type of the bullet for future behaviors (e.g., wood bullets have special effects)

    return bullet;
}

export function hitEnemy(bullet, enemy) {
    let damage = bullet.damage;
    bullet.destroy(); 

    // 销毁子弹拖尾
    if (bullet.trailEmitter) {
        bullet.trailEmitter.destroy();
    }

    enemy.hp -= damage; 
    
    enemy.setTint(0xffffff);
    enemy.scene.time.delayedCall(100, () => { 
        if(enemy.active) {
            if (enemy.isPhase2) {
                enemy.setTint(0xff0000);
            } else {
                enemy.clearTint();
            } 
        }
    });

    if (enemy.hp <= 0) {
        // Play bounty text effect (use enemy.scene to get current scene directly)
        let bountyText = enemy.scene.add.text(enemy.x, enemy.y, '+10$', { fill: '#ffd700', fontStyle: 'bold' });
        
        enemy.scene.tweens.add({ 
            targets: bountyText, y: enemy.y - 30, alpha: 0, duration: 800, 
            onComplete: () => bountyText.destroy() 
        });

        // 如果有分裂逻辑 则在摧毁之前进行分裂
        if (enemy.splitInto) {
            enemy.scene.handleEnemySplit(enemy.x, enemy.y, enemy);
        }

        enemy.destroy(); 

        if (enemy.shieldEmitter) enemy.shieldEmitter.destroy();
        
        // [Key]: Enemy is dead, return true
        return true; 
    }
    
    // [Key]: Enemy is not dead, return false
    return false;
}