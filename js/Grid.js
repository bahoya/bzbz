class Grid {
    constructor(width, height, cellSize) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.cells = [];
        this.init();
    }

    init() {
        this.cols = Math.ceil(this.width / this.cellSize);
        this.rows = Math.ceil(this.height / this.cellSize);
        this.cells = new Array(this.cols * this.rows).fill(null).map(() => []);
    }

    clear() {
        for (let i = 0; i < this.cells.length; i++) {
            this.cells[i].length = 0; // Fast clear
        }
    }

    // Get cell index from coordinate
    getIndex(x, y) {
        let col = Math.floor(x / this.cellSize);
        let row = Math.floor(y / this.cellSize);

        // Clamp to bounds
        if (col < 0) col = 0;
        if (col >= this.cols) col = this.cols - 1;
        if (row < 0) row = 0;
        if (row >= this.rows) row = this.rows - 1;

        return row * this.cols + col;
    }

    // Insert entity into grid
    insert(entity) {
        // Determine range of cells entity overlaps
        // Assuming entity has x, y, width, height or radius
        let x = entity.x;
        let y = entity.y;
        let w = entity.width || (entity.radius * 2) || 0;
        let h = entity.height || (entity.radius * 2) || 0;

        // If radius is used, x/y might be center or top-left.
        // Game code uses mostly top-left for rects, center for circles but draws consistently.
        // Let's assume passed entities handle their own bounds or we calculate effectively.
        // For simplicity:
        // Rects: x, y is top-left.
        // Circles: x, y is center (usually). But in this game code:
        // Player/Enemy: x,y is top-left. radius usage inconsistent in collision?
        // Let's use bounding box loosely.

        // If entity has radius and no width/height, assume x,y is center
        if (entity.radius && !entity.width) {
            x -= entity.radius;
            y -= entity.radius;
            w = entity.radius * 2;
            h = entity.radius * 2;
        }

        const startCol = Math.floor(x / this.cellSize);
        const endCol = Math.floor((x + w) / this.cellSize);
        const startRow = Math.floor(y / this.cellSize);
        const endRow = Math.floor((y + h) / this.cellSize);

        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                if (c >= 0 && c < this.cols && r >= 0 && r < this.rows) {
                    this.cells[r * this.cols + c].push(entity);
                }
            }
        }
    }

    // Retrieve potential collisions for an entity
    retrieve(entity) {
        let x = entity.x;
        let y = entity.y;
        let w = entity.width || (entity.radius * 2) || 0;
        let h = entity.height || (entity.radius * 2) || 0;

        if (entity.radius && !entity.width) {
            x -= entity.radius;
            y -= entity.radius;
            w = entity.radius * 2;
            h = entity.radius * 2;
        }

        const startCol = Math.floor(x / this.cellSize);
        const endCol = Math.floor((x + w) / this.cellSize);
        const startRow = Math.floor(y / this.cellSize);
        const endRow = Math.floor((y + h) / this.cellSize);

        const candidates = new Set(); // Use Set to avoid duplicates

        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                if (c >= 0 && c < this.cols && r >= 0 && r < this.rows) {
                    const cell = this.cells[r * this.cols + c];
                    for (let i = 0; i < cell.length; i++) {
                        if (cell[i] !== entity) {
                            candidates.add(cell[i]);
                        }
                    }
                }
            }
        }
        return Array.from(candidates);
    }
}
