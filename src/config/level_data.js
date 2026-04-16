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
        initialMoney: 150, 
        initialLives: 15,  

        waypoints: [
            { col: 0, row: 2 },   // Start Point (Left)
            { col: 12, row: 3 },  // Supply Point 1 (Right Top)
            { col: 14, row: 8 },  // Supply Point 2 (Right Bottom)
            { col: 5, row: 9 },   // Supply Point 3 (Left Bottom)
            { col: 5, row: 4 }   // End Point (Bottom)
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
    }
};