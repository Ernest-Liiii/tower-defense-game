// ================= 敌人配置 =================
const ENEMY_DATA = {
    // 基础近战兵：血量2000 [cite: 63]，伤害150 [cite: 66] (速度设为40代表每秒走1格)
    'melee':  { hp: 2000, speed: 40,   damage: 150 }, 
    // 基础远程兵：血量1500 [cite: 69]，伤害100 [cite: 72]
    'ranged': { hp: 1500, speed: 26.6, damage: 100 }  
};

export { ENEMY_DATA };