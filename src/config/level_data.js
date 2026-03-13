// ================= 关卡配置 =================
const LEVEL_DATA = {
    // 关卡1：教学关卡 [cite: 24]
    level1: {
        initialMoney: 100, // 初始费用：100 [cite: 26]
        initialLives: 10,  // 生命值：10 [cite: 27]
        
        // 【新增】定義波次陣列
        waves: [
            // 第一波：遊戲開始 2 秒後出怪，總共出 5 隻，每隻間隔 1500 毫秒
            { count: 5, interval: 1500, startDelay: 2000 }, 
            
            // 第二波：第一波出完後的 5 秒開始，總共出 10 隻，出怪速度變快 (1000 毫秒)
            { count: 10, interval: 1000, startDelay: 5000 },
            
            // 第三波：第二波出完後的 8 秒開始，總共出 15 隻，出怪速度極快 (800 毫秒)
            { count: 15, interval: 800, startDelay: 8000 }
        ],

        backgroundTexture: [
            { key: 'grass', path: 'assets/images/Grass.png' }, // 草地背景
            { key: 'dirt', path: 'assets/images/Dirt.png' }    // 泥地背景
        ]
    }
};

export { LEVEL_DATA };