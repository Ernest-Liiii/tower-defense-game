// this file is used to store the data for thw elemental towers

const TOWER_DATA = {

    // 金塔：建塔费用50 [cite: 32]，生命值1000 [cite: 33]
    'gold':  { cost: 50,  hp: 1000, range: 0,   damage: 0,   color: 0xffd700 }, 

    // 水塔：建塔费用50 [cite: 40]，生命值1500 [cite: 41]
    'water': { cost: 50,  hp: 1500, range: 0,   damage: 0,   color: 0x3498db }, 
    
    // 火塔：建塔费用100 [cite: 51]，生命值1500 [cite: 52]，攻击伤害500 [cite: 56]
    'fire':  { cost: 100, hp: 1500, range: 0, rangeType: 'grid3x3', damage: 500, color: 0xe74c3c }  
};

export { TOWER_DATA };