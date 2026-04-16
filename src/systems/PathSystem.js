// this file is used to adjust the path of the enemy
export class PathSystem {
    constructor(scene) {
        this.scene = scene;
        this.cellSize = 40;
        this.cols = 800 / this.cellSize; // 20 columns
        this.rows = 600 / this.cellSize; // 15 rows
        
        this.waypoints = [];
        this.currentFullPath = []; // Store the current calculated complete pixel path
    }

    // Initialize and read waypoints from level data
    init(levelData) {
        this.waypoints = levelData.waypoints;
        this.recalculatePath(); // Calculate initial path once at game start
    }

    // Recalculate the complete path
    recalculatePath() {
        let fullPath = [];
        
        // Calculate path between each pair of adjacent waypoints (e.g., start->point1, point1->point2...)
        for (let i = 0; i < this.waypoints.length - 1; i++) {
            let startNode = this.waypoints[i];
            let endNode = this.waypoints[i + 1];
            
            // Call BFS pathfinding algorithm
            let pathSegment = this.findPathBFS(startNode, endNode);
            
            // If a path segment cannot be found (blocked completely by towers), return false
            if (!pathSegment) {
                console.warn("Path is completely blocked!");
                return false; 
            }
            
            // Add this path segment to the total path (avoid duplicating nodes)
            if (i === 0) {
                fullPath = fullPath.concat(pathSegment);
            } else {
                fullPath = fullPath.concat(pathSegment.slice(1));
            }
        }

        // Convert grid coordinates (col, row) to pixel coordinates (x, y)
        this.currentFullPath = fullPath.map(node => ({
            x: node.col * this.cellSize + this.cellSize / 2,
            y: node.row * this.cellSize + this.cellSize / 2
        }));

        // Development debug: draw path on screen
        // this.drawDebugPath();
        
        return true; // Successfully found path
    }

    // Core pathfinding algorithm (Breadth-First Search)
    findPathBFS(start, target) {
        let queue = [start];
        let visited = new Set();
        let parentMap = new Map(); // Used to backtrack path

        // Create a function to generate unique key for Set
        const toKey = (col, row) => `${col},${row}`;
        visited.add(toKey(start.col, start.row));

        // Check if a cell is walkable (within bounds and no defense tower)
        const isWalkable = (col, row) => {
            if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
            
            // Convert grid coordinates back to pixel coordinates, check for towers
            let pixelX = col * this.cellSize + this.cellSize / 2;
            let pixelY = row * this.cellSize + this.cellSize / 2;
            
            let hasTower = this.scene.towers.some(t => t.x === pixelX && t.y === pixelY);
            return !hasTower; // Can walk only if no tower
        };

        // Four movement directions: up, down, left, right
        const directions = [
            { c: 0, r: -1 }, { c: 0, r: 1 }, 
            { c: -1, r: 0 }, { c: 1, r: 0 }
        ];

        while (queue.length > 0) {
            let current = queue.shift();

            // Reached target! Start backtracking path
            if (current.col === target.col && current.row === target.row) {
                let path = [];
                let curr = current;
                while (curr) {
                    path.push(curr);
                    curr = parentMap.get(toKey(curr.col, curr.row));
                }
                return path.reverse(); // Reverse array since we backtracked from end
            }

            // Explore four directions
            for (let dir of directions) {
                let nextCol = current.col + dir.c;
                let nextRow = current.row + dir.r;
                let nextKey = toKey(nextCol, nextRow);

                if (isWalkable(nextCol, nextRow) && !visited.has(nextKey)) {
                    visited.add(nextKey);
                    let nextNode = { col: nextCol, row: nextRow };
                    queue.push(nextNode);
                    parentMap.set(nextKey, current); // Record where it came from
                }
            }
        }

        return null; // Path not found (blocked)
    }

    // (Testing only) Draw current route on screen
    drawDebugPath() {
        if (this.debugGraphics) this.debugGraphics.destroy();
        this.debugGraphics = this.scene.add.graphics();
        this.debugGraphics.lineStyle(4, 0x00ff00, 0.5); // Semi-transparent green line

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