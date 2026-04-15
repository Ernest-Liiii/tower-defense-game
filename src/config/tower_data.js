// this file is used to store the data for thw elemental towers

const TOWER_DATA = {

    // 金塔：建塔费用50 [cite: 32]，生命值1000 [cite: 33]
    'gold':  { 
        cost: 50,  hp: 1000, range: 0,   damage: 0,   color: 0xffd700,
        description: '造价: $50\n伤害: 0\n特性: 每隔一段时间为你产出额外金币，\n是经济的来源。'
     }, 

    // 水塔：建塔费用50 [cite: 40]，生命值1500 [cite: 41]
    'water': { 
        cost: 50,  hp: 1500, range: 0,   damage: 0,   color: 0x3498db,
        description: '造价: $50\n伤害: 0\n特性: 提供治疗效果，\n恢复周围友方单位的生命值。'
    }, 

    // 火塔：建塔费用100 [cite: 51]，生命值1500 [cite: 52]，攻击伤害500 [cite: 56]
    'fire':  { 
        cost: 100, hp: 1500, range: 0, rangeType: 'grid3x3', damage: 500, color: 0xe74c3c,
        description: '造价: $100\n伤害: 500\n特性: 对范围内的敌人造成高额火焰伤害。'
    },

    'wood': { 
        cost: 75, hp: 1200, range: 120, damage: 20, color: 0x2ecc71,
        description: '造价: $75\n伤害: 20\n特性: 攻击使敌人中毒，减速并造成持续伤害。'
    },

    'earth': { 
        cost: 120, hp: 4000, range: 100, damage: 0, color: 0xe67e22,
        description: '造价: $120\n伤害: 0\n特性: 极高血量，一段时间后对周围敌人造成短暂眩晕。'
    }
};

export { TOWER_DATA };