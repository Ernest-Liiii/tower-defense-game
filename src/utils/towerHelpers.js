// This file contains helper functions for managing towers in the game

// this is a helper function to find the first enemy in range of a tower,
// prioritizing the one that has been on the map the longest (i.e., closest to the end)
export function getEnemyInRange(tower, enemies) {
    let target = null;
    let oldestSpawnTime = Infinity;

    enemies.forEach(enemy => {
        if (enemy.active) {
            let inRange = false;

            // special range check for fire tower (directional 3x3 grid)
            if (tower.type === 'fire') {
                let cx = tower.x, cy = tower.y;
                let minX, maxX, minY, maxY;

                if (tower.direction === 'up') { minX = cx - 60; maxX = cx + 60; minY = cy - 100; maxY = cy + 20; }
                else if (tower.direction === 'down') { minX = cx - 60; maxX = cx + 60; minY = cy - 20; maxY = cy + 100; }
                else if (tower.direction === 'left') { minX = cx - 100; maxX = cx + 20; minY = cy - 60; maxY = cy + 60; }
                else if (tower.direction === 'right') { minX = cx - 20; maxX = cx + 100; minY = cy - 60; maxY = cy + 60; }

                // check if enemy is within the defined rectangle
                if (enemy.x >= minX && enemy.x <= maxX && enemy.y >= minY && enemy.y <= maxY) {
                    inRange = true;
                }
            } 

            // default range check for other tower types (circular range)
            else if (tower.range > 0) {
                let distance = Phaser.Math.Distance.Between(tower.x, tower.y, enemy.x, enemy.y);
                if (distance <= tower.range) inRange = true;
            }

            // look for the enemy that has been on the map the longest (smallest spawnTime) among those in range
            if (inRange && enemy.spawnTime < oldestSpawnTime) {
                oldestSpawnTime = enemy.spawnTime;
                target = enemy;
            }
        }
    });
    
    return target;
}

// this is a helper function to draw the directional range of a fire tower
export function drawDirectionalRange(graphics, cx, cy, dir, type, alpha = 0.3) {
    graphics.clear();
    if (type !== 'fire') return; // only draw for fire towers

    // it will have more different towers in the future, so we can use type to determine the color and shape of the range indicator

    graphics.fillStyle(0xe74c3c, alpha);
    let minX, minY, width = 120, height = 120; 
    // 3x3 grid with 40px per cell, 
    // so total width and height are 120px

    // according to the direction, we will draw a rectangle in the corresponding area
    // draw the specific area od the 3x3 grid based on the direction of the fire tower
    if (dir === 'up') { minX = cx - 60; minY = cy - 100; }
    else if (dir === 'down') { minX = cx - 60; minY = cy - 20; }
    else if (dir === 'left') { minX = cx - 100; minY = cy - 60; }
    else if (dir === 'right') { minX = cx - 20; minY = cy - 60; }

    graphics.fillRect(minX, minY, width, height);
}
