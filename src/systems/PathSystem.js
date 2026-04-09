// this file is used to adjust the path of the enemy
export class PathSystem {
    constructor(scene) {
        this.scene = scene;
        this.cellSize = 40;
        this.cols = 800 / this.cellSize; // 20列
        this.rows = 600 / this.cellSize; // 15行
        
        this.waypoints = [];
        this.currentFullPath = []; // 儲存當前計算出的完整像素路徑
    }

    // 初始化讀取關卡的航點
    init(levelData) {
        this.waypoints = levelData.waypoints;
        this.recalculatePath(); // 遊戲一開始先計算一次初始路徑
    }

    // 重新計算完整路徑
    recalculatePath() {
        let fullPath = [];
        
        // 依序計算每兩個相鄰航點之間的路徑 (例如：起點->點1, 點1->點2...)
        for (let i = 0; i < this.waypoints.length - 1; i++) {
            let startNode = this.waypoints[i];
            let endNode = this.waypoints[i + 1];
            
            // 呼叫 BFS 尋路演算法
            let pathSegment = this.findPathBFS(startNode, endNode);
            
            // 如果有一段路徑找不到 (被塔完全堵死了)，回傳 false
            if (!pathSegment) {
                console.warn("路徑被堵死了！");
                return false; 
            }
            
            // 將這段路徑加入總路徑中 (避免重複加入節點)
            if (i === 0) {
                fullPath = fullPath.concat(pathSegment);
            } else {
                fullPath = fullPath.concat(pathSegment.slice(1));
            }
        }

        // 將網格座標 (col, row) 轉換為遊戲中的像素座標 (x, y)
        this.currentFullPath = fullPath.map(node => ({
            x: node.col * this.cellSize + this.cellSize / 2,
            y: node.row * this.cellSize + this.cellSize / 2
        }));

        // 開發除錯用：在畫面上畫出路徑
        // this.drawDebugPath();
        
        return true; // 成功找到路徑
    }

    // 核心尋路演算法 (Breadth-First Search)
    findPathBFS(start, target) {
        let queue = [start];
        let visited = new Set();
        let parentMap = new Map(); // 用來回溯路徑

        // 建立一個函數來生成 Set 的唯一 Key
        const toKey = (col, row) => `${col},${row}`;
        visited.add(toKey(start.col, start.row));

        // 檢查該格子是否可以走 (沒有超出邊界，且沒有防禦塔)
        const isWalkable = (col, row) => {
            if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
            
            // 將網格座標轉回像素座標，檢查場上的塔
            let pixelX = col * this.cellSize + this.cellSize / 2;
            let pixelY = row * this.cellSize + this.cellSize / 2;
            
            let hasTower = this.scene.towers.some(t => t.x === pixelX && t.y === pixelY);
            return !hasTower; // 沒有塔才可以走
        };

        // 四個移動方向：上, 下, 左, 右
        const directions = [
            { c: 0, r: -1 }, { c: 0, r: 1 }, 
            { c: -1, r: 0 }, { c: 1, r: 0 }
        ];

        while (queue.length > 0) {
            let current = queue.shift();

            // 抵達目標！開始回溯路徑
            if (current.col === target.col && current.row === target.row) {
                let path = [];
                let curr = current;
                while (curr) {
                    path.push(curr);
                    curr = parentMap.get(toKey(curr.col, curr.row));
                }
                return path.reverse(); // 因為是從終點回溯，所以要反轉陣列
            }

            // 探索四個方向
            for (let dir of directions) {
                let nextCol = current.col + dir.c;
                let nextRow = current.row + dir.r;
                let nextKey = toKey(nextCol, nextRow);

                if (isWalkable(nextCol, nextRow) && !visited.has(nextKey)) {
                    visited.add(nextKey);
                    let nextNode = { col: nextCol, row: nextRow };
                    queue.push(nextNode);
                    parentMap.set(nextKey, current); // 記錄從哪裡來的
                }
            }
        }

        return null; // 找不到路徑 (被堵死)
    }

    // (測試用) 在畫面上畫出目前的路線
    drawDebugPath() {
        if (this.debugGraphics) this.debugGraphics.destroy();
        this.debugGraphics = this.scene.add.graphics();
        this.debugGraphics.lineStyle(4, 0x00ff00, 0.5); // 半透明綠色線條

        if (this.currentFullPath.length > 0) {
            this.debugGraphics.beginPath();
            this.debugGraphics.moveTo(this.currentFullPath[0].x, this.currentFullPath[0].y);
            for (let i = 1; i < this.currentFullPath.length; i++) {
                this.debugGraphics.lineTo(this.currentFullPath[i].x, this.currentFullPath[i].y);
            }
            this.debugGraphics.strokePath();
        }
    }
}