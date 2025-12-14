class Axe {
    constructor(game, x, y, targetX, targetY, type = 'axe') {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 60;
        this.speed = 600; // px/sec
        this.radius = 30;
        this.rotation = 0;
        this.markedForDeletion = false;
        this.lifeTimer = 1.0; // Seconds
        this.type = type;

        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance === 0) {
            this.vx = this.speed; // Default direction if 0
            this.vy = 0;
        } else {
            this.vx = (dx / distance) * this.speed;
            this.vy = (dy / distance) * this.speed;
        }

        this.image = new Image();
        if (this.type === 'axe') {
            this.image.src = getAsset('assets/axe.png');
        } else if (this.type === 'mayonez') {
            this.image.src = getAsset('assets/mayonez.png');
        }
    }

    update(deltaTime) {
        if (!deltaTime) deltaTime = 0.016;

        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.rotation += 10 * deltaTime;

        this.lifeTimer -= deltaTime;
        if (this.lifeTimer <= 0) {
            this.markedForDeletion = true;
        }

        // Remove if off world
        if (this.x < -50 || this.x > this.game.worldWidth + 50 ||
            this.y < -50 || this.y > this.game.worldHeight + 50) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        if (this.image.complete) {
            ctx.drawImage(this.image, -30, -30, 60, 60);
        } else {
            ctx.fillStyle = 'gray';
            ctx.fillRect(-15, -15, 30, 30);
        }
        ctx.restore();
    }
}
