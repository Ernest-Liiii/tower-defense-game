// this file is used to store the information of the levels

export const LEVEL_DATA = {
    level1: {
        initialMoney: 1000, 
        initialLives: 10,  

        waypoints: [
            { col: 0, row: 2 },   // Start Point (Left)
            { col: 14, row: 2 },  // Supply Point 1 (Right Top)
            { col: 14, row: 9 },  // Supply Point 2 (Right Bottom)
            { col: 5, row: 9 },   // Supply Point 3 (Left Bottom)
            { col: 5, row: 14 }   // End Point (Bottom)
        ],
        
        // New wave definitions
        waves: [
            // Wave 1: Basic tutorial with only melee units
            {
                startDelay: 2000, // Preparation time before this wave (2 seconds)
                enemies: [
                    { type: 'melee', amount: 5, interval: 1500 } // Spawn 5 melee units, 1 every 1.5 seconds
                ]
            },
            
            // Wave 2: Increased quantity and mixed with ranged units
            {
                startDelay: 5000, // 5 seconds after wave 1 is cleared
                enemies: [
                    { type: 'melee', amount: 8, interval: 1200 }, 
                    // [Advanced Setting] delay = how long after wave starts to spawn this enemy type
                    { type: 'ranged', amount: 3, interval: 2000, delay: 5000 } 
                ]
            },

            // Wave 3: Major assault
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
        initialMoney: 300, 
        initialLives: 15,  

        waypoints: [
            { col: 0, row: 2 },   
            { col: 12, row: 3 },  
            { col: 14, row: 8 },  
            { col: 5, row: 9 },   
            { col: 5, row: 4 }   
        ],
        
        waves: [
            // Wave 1: Warm up
            {
                startDelay: 2000,
                enemies: [
                    { type: 'melee', amount: 6, interval: 1200 }
                ]
            },
            // Wave 2: Ranged mixed
            {
                startDelay: 6000, 
                enemies: [
                    { type: 'melee', amount: 8, interval: 1000 }, 
                    { type: 'ranged', amount: 5, interval: 1500, delay: 3000 } 
                ]
            },
            // Wave 3: 【测试波次】 飞行敌人闪亮登场！
            {
                startDelay: 8000, 
                enemies: [
                    { type: 'flying', amount: 8, interval: 1000 } // 它们会无视上面的waypoints，直奔终点！
                ]
            },
            // Wave 4: 陆空协同作战
            {
                startDelay: 10000, 
                enemies: [
                    { type: 'melee', amount: 12, interval: 800 },
                    { type: 'ranged', amount: 8, interval: 1200, delay: 2000 },
                    { type: 'flying', amount: 6, interval: 1500, delay: 4000 }
                ]
            }
        ]
    },

    level3: {
        initialMoney: 400, 
        initialLives: 15,  

        // U-Turn Path (U型路线)
        waypoints: [
            { col: 1, row: 1 },
            { col: 18, row: 1 },
            { col: 18, row: 13 },
            { col: 1, row: 13 }
        ],
        
        waves: [
            {
                startDelay: 3000,
                enemies: [
                    { type: 'melee', amount: 10, interval: 1000 }
                ]
            },
            {
                startDelay: 6000, 
                enemies: [
                    { type: 'melee', amount: 10, interval: 800 }, 
                    { type: 'flying', amount: 5, interval: 1200, delay: 2000 } 
                ]
            },
            {
                startDelay: 8000, 
                enemies: [
                    { type: 'ranged', amount: 15, interval: 1000 }
                ]
            },
            {
                startDelay: 10000, 
                enemies: [
                    { type: 'melee', amount: 20, interval: 600 },
                    { type: 'flying', amount: 10, interval: 1000, delay: 5000 },
                    { type: 'ranged', amount: 10, interval: 1200, delay: 8000 }
                ]
            }
        ]
    },

    level4: {
        initialMoney: 500, 
        initialLives: 20,  

        // Snake Path (蛇形路线，非常适合造范围塔)
        waypoints: [
            { col: 0, row: 2 },
            { col: 16, row: 2 },
            { col: 16, row: 6 },
            { col: 3, row: 6 },
            { col: 3, row: 11 },
            { col: 19, row: 11 }
        ],
        
        waves: [
            {
                startDelay: 3000,
                enemies: [
                    { type: 'melee', amount: 15, interval: 800 },
                    { type: 'ranged', amount: 5, interval: 1500, delay: 5000 }
                ]
            },
            {
                startDelay: 8000, 
                enemies: [
                    { type: 'flying', amount: 15, interval: 800 } 
                ]
            },
            {
                startDelay: 8000, 
                enemies: [
                    { type: 'melee', amount: 25, interval: 500 },
                    { type: 'ranged', amount: 15, interval: 800, delay: 4000 }
                ]
            },
            {
                startDelay: 12000, 
                enemies: [
                    { type: 'melee', amount: 30, interval: 400 },
                    { type: 'flying', amount: 20, interval: 600, delay: 3000 },
                    { type: 'ranged', amount: 20, interval: 700, delay: 6000 }
                ]
            }
        ]
    },

    level5: {
        initialMoney: 800, 
        initialLives: 20,  

        // Straight Rush (直线极速冲锋路线，防守时间极短)
        waypoints: [
            { col: 0, row: 7 },
            { col: 19, row: 7 }
        ],
        
        waves: [
            {
                startDelay: 4000,
                enemies: [
                    { type: 'melee', amount: 20, interval: 600 }
                ]
            },
            {
                startDelay: 6000, 
                enemies: [
                    { type: 'flying', amount: 20, interval: 500 },
                    { type: 'ranged', amount: 15, interval: 800, delay: 2000 }
                ]
            },
            {
                startDelay: 8000, 
                enemies: [
                    { type: 'melee', amount: 40, interval: 400 },
                    { type: 'flying', amount: 30, interval: 400, delay: 3000 }
                ]
            },
            {
                startDelay: 10000, 
                // 终极决战波次：三种敌人同屏狂潮
                enemies: [
                    { type: 'melee', amount: 50, interval: 300 },
                    { type: 'ranged', amount: 30, interval: 500, delay: 2000 },
                    { type: 'flying', amount: 40, interval: 400, delay: 4000 }
                ]
            }
        ]
    }
};