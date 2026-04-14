// this file is used to store the information of the enemy

const ENEMY_DATA = {
    // 基础近战兵：血量2000 [cite: 63]，伤害150 [cite: 66] (速度设为40代表每秒走1格)
    'melee':  { 
        hp: 2000, 
        speed: 40,   
        damage: 150,
        textureKey: 'slime',
        attackRange: 45,
        attackCooldown: 12000
    }, 
    
    // 基础远程兵：血量1500 [cite: 69]，伤害100 [cite: 72]
    'ranged': { 
        hp: 1500, 
        speed: 26.6, 
        damage: 100,
        textureKey: 'ranged_goblin',
        attackRange: 150, 
        attackCooldown: 4000
    }  
};

export { ENEMY_DATA };