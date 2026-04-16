// this file is used to store the data for the elemental towers

const TOWER_DATA = {

    // Gold Tower: Cost $50 [cite: 32], HP 1000 [cite: 33]
    'gold':  { 
        cost: 50,  hp: 1000, range: 0,   damage: 0,   color: 0xffd700,
        description: 'Cost: $50\nDamage: 0\nAbility: Generates extra coins over time,\nserving as your primary income source.'
     }, 

    // Water Tower: Cost $50 [cite: 40], HP 1500 [cite: 41]
    'water': { 
        cost: 50,  hp: 1500, range: 0,   damage: 0,   color: 0x3498db,
        description: 'Cost: $50\nDamage: 0\nAbility: Provides healing effect,\nrestores HP of nearby friendly units.'
    }, 

    // Fire Tower: Cost $100 [cite: 51], HP 1500 [cite: 52], Attack Damage 500 [cite: 56]
    'fire':  { 
        cost: 100, hp: 1500, range: 0, rangeType: 'grid3x3', damage: 500, color: 0xe74c3c,
        description: 'Cost: $100\nDamage: 500\nAbility: Deals high flame damage to enemies in range.'
    },

    // Wood Tower: Cost $75 [cite: 44], HP 1200 [cite: 45], Attack Damage 200 [cite: 48]
    'wood': { 
        cost: 75, hp: 1200, range: 120, damage: 200, color: 0x2ecc71,
        description: 'Cost: $75\nDamage: 200\nAbility: Attacks poison enemies, causing slow and DoT.'
    },

    // Earth Tower: Cost $120 [cite: 58], HP 4000 [cite: 59]
    'earth': { 
        cost: 120, hp: 4000, range: 100, damage: 0, color: 0xe67e22,
        description: 'Cost: $120\nDamage: 0\nAbility: Very high HP, stuns nearby enemies after a delay.'
    }
};

export { TOWER_DATA };