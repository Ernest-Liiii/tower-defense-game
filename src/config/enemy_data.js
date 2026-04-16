// this file is used to store the information of enemies

const ENEMY_DATA = {
    // Basic Melee Unit: HP 2000 [cite: 63], Damage 150 [cite: 66] (speed 40 = 1 tile/second)
    'melee':  { 
        hp: 2000, 
        speed: 40,   
        damage: 150,
        textureKey: 'slime',
        attackRange: 45,
        attackCooldown: 12000
    }, 
    
    // Basic Ranged Unit: HP 1500 [cite: 69], Damage 100 [cite: 72]
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