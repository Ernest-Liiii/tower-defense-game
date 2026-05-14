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
    }, 

    'flying': {
        hp: 1000, 
        speed: 55, 
        damage: 80,
        textureKey: 'flying', 
        attackRange: 45,
        attackCooldown: 2000,
        isFlying: true
    },

    'boss_slime': {
        hp: 15000,
        speed: 30,             // 走得很慢
        damage: 200,
        attackCooldown: 5000,
        attackRange: 80,
        textureKey: 'boss_slime',
        splitInto: 'middle_slime', // 死亡后分裂成这个 ID 的怪物
        splitCount: 2,             // 分裂出 2 个
    },

    // 2. 分裂出来的小史莱姆
    'middle_slime': {
        hp: 4000,
        speed: 55,             // 走得很快！
        damage: 80,
        attackCooldown: 2000,
        attackRange: 40,
        textureKey: 'middle_slime',
        splitInto: 'mini_slime',   // 死亡后继续分裂成更小的史莱姆
        splitCount: 4             // 每个中史莱姆分裂出 4 个小史莱姆
    },

    // 3. 最小的史莱姆，无法再分裂了
    'mini_slime': {
        hp: 1000,
        speed: 80,             // 走得非常快！
        damage: 20,
        attackCooldown: 1000,
        attackRange: 20,
        textureKey: 'mini_slime'
    },

    'elemental_devourer': {
        hp: 38000,             // 血量极厚
        speed: 20,             // 移动缓慢，给玩家足够的时间应对机制
        damage: 400,
        textureKey: 'elemental_devourer',
        attackRange: 100,      // 攻击范围较大，迫使玩家保持距离
        attackCooldown: 3000,  // 攻击频率适中，增加威胁感
        isBoss: true,          // 标记为 Boss
        bossType: 'devourer'   // 专属 Boss 标记，用于触发机制
    },
};

export { ENEMY_DATA };