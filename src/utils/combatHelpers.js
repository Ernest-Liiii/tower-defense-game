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
}

// this is a helper function to handle the logic when a bullet kills an enemy
export function hitEnemy(scene, bullet, enemy, playerMoney, moneyText) {
    let damage = bullet.damage;
    bullet.destroy(); 
    enemy.hp -= damage; 
    
    enemy.setTint(0xffffff);
    enemy.scene.time.delayedCall(100, () => { if(enemy.active) enemy.clearTint(); });

    if (enemy.hp <= 0) {
        // add money to the player when an enemy is killed
        playerMoney.value += 10;
        moneyText.setText('$: ' + playerMoney.value);
        
        // the animation of showing the money gained when an enemy is killed
        let bountyText = enemy.scene.add.text(enemy.x, enemy.y, '+10$', { fill: '#ffd700', fontStyle: 'bold' });
        // animation that makes the text float up and fade out
        enemy.scene.tweens.add({ 
            targets: bountyText, y: enemy.y - 30, alpha: 0, duration: 800, 
            onComplete: () => bountyText.destroy() 
        });

        enemy.destroy(); 
    }
}