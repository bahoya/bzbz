class Obstacle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'tree' or 'rock'
        this.width = 100; // Increased size for visibility
        this.height = 100;

        this.image = new Image();
        this.image.src = this.type === 'tree' ? getAsset('assets/tree.png') : getAsset('assets/rock.png');

        this.mask = null;
        this.image.onload = () => {
            this.mask = createImageMask(this.image);
        };
    }

    draw(ctx) {
        if (this.image.complete) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            // Fallback while loading
            ctx.fillStyle = this.type === 'tree' ? 'green' : 'gray';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        // Debug box
        /*
        ctx.strokeStyle = 'yellow';
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        */
    }
}
