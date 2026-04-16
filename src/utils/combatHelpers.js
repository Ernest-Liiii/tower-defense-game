// this is a file to store helper functions related to combat, 
// such as calculating damage, checking for enemy in range, etc.

// this is a function to handle shooting logic when a tower shoots at an enemy
export function shoot(scene, tower, target, bullets, isBuffed = false) {
    // judging whether the bullet should be buffed based on whether the tower is currently buffed by a water tower
    let textureToUse = isBuffed ? 'boilingBulletTexture' : 'bulletTexture';
    
    let bullet = bullets.create(tower.x, tower.y, textureToUse);
    
    // if the bullet is buffed, it will have 50% more damage than normal
    bullet.damage = isBuffed ? tower.damage * 1.5 : tower.damage; 
    bullet.target = target; 

    bullet.towerType = tower.type; // Record tower type of the bullet for future behaviors (e.g., wood bullets have special effects)

    return bullet;
}

export function hitEnemy(bullet, enemy) {
    let damage = bullet.damage;
    bullet.destroy(); 
    enemy.hp -= damage; 
    
    enemy.setTint(0xffffff);
    enemy.scene.time.delayedCall(100, () => { if(enemy.active) enemy.clearTint(); });

    if (enemy.hp <= 0) {
        // Play bounty text effect (use enemy.scene to get current scene directly)
        let bountyText = enemy.scene.add.text(enemy.x, enemy.y, '+10$', { fill: '#ffd700', fontStyle: 'bold' });
        
        enemy.scene.tweens.add({ 
            targets: bountyText, y: enemy.y - 30, alpha: 0, duration: 800, 
            onComplete: () => bountyText.destroy() 
        });

        enemy.destroy(); 
        
        // [Key]: Enemy is dead, return true
        return true; 
    }
    
    // [Key]: Enemy is not dead, return false
    return false;
}