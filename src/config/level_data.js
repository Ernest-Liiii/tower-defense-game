// this file is used to store the information of the levels

export const LEVEL_DATA = {
    level1: {
        initialMoney: 100, 
        initialLives: 10,  

        waypoints: [
            { col: 0, row: 2 },   // 起點 (左側)
            { col: 14, row: 2 },  // 補給點 1 (右上)
            { col: 14, row: 9 },  // 補給點 2 (右下)
            { col: 5, row: 9 },   // 補給點 3 (左下)
            { col: 5, row: 14 }   // 終點 (底部)
        ],
        
        // 全新的波次定義
        waves: [
            // 第一波：純粹的新手教學，只出幾隻基礎近戰兵
            {
                startDelay: 2000, // 這波開始前的準備時間 (2秒)
                enemies: [
                    { type: 'melee', amount: 5, interval: 1500 } // 出 5 隻近戰兵，每 1.5 秒出一隻
                ]
            },
            
            // 第二波：數量增加，且開始混搭遠程兵
            {
                startDelay: 5000, // 第一波清空後，給玩家 5 秒準備
                enemies: [
                    { type: 'melee', amount: 8, interval: 1200 }, 
                    // 【進階設定】delay 代表在「這波開始後」延遲多久才開始出這種類型的怪
                    { type: 'ranged', amount: 3, interval: 2000, delay: 5000 } 
                ]
            },

            // 第三波：大軍壓境
            {
                startDelay: 8000, 
                enemies: [
                    { type: 'melee', amount: 15, interval: 800 },
                    { type: 'ranged', amount: 10, interval: 1000, delay: 3000 }
                ]
            }
        ]
    },
    level2: {
        initialMoney: 150, 
        initialLives: 15,  

        waypoints: [
            { col: 0, row: 2 },   // 起點 (左側)
            { col: 12, row: 3 },  // 補給點 1 (右上)
            { col: 14, row: 8 },  // 補給點 2 (右下)
            { col: 5, row: 9 },   // 補給點 3 (左下)
            { col: 5, row: 4 }   // 終點 (底部)
        ],
        
        // 全新的波次定義
        waves: [
            // 第一波：純粹的新手教學，只出幾隻基礎近戰兵
            {
                startDelay: 2000, // 這波開始前的準備時間 (2秒)
                enemies: [
                    { type: 'melee', amount: 5, interval: 1500 } // 出 5 隻近戰兵，每 1.5 秒出一隻
                ]
            },
            
            // 第二波：數量增加，且開始混搭遠程兵
            {
                startDelay: 5000, // 第一波清空後，給玩家 5 秒準備
                enemies: [
                    { type: 'melee', amount: 8, interval: 1200 }, 
                    // 【進階設定】delay 代表在「這波開始後」延遲多久才開始出這種類型的怪
                    { type: 'ranged', amount: 3, interval: 2000, delay: 5000 } 
                ]
            },

            // 第三波：大軍壓境
            {
                startDelay: 8000, 
                enemies: [
                    { type: 'melee', amount: 15, interval: 800 },
                    { type: 'ranged', amount: 10, interval: 1000, delay: 3000 }
                ]
            }
        ]
    }
};