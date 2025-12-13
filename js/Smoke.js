class Smoke {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.maxRadius = 50;
        this.life = 3; // Seconds
        this.maxLife = 3;
        this.expansionRate = 20; // Radius expansion per second
        this.damagePerSecond = 10;
        this.markedForDeletion = false;
        this.color = 'rgba(0, 255, 0, 0.5)';
        // Random drift
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
    }

    update(deltaTime) {
        this.life -= deltaTime;
        if (this.life <= 0) {
            this.markedForDeletion = true;
        }

        // Expand
        if (this.radius < this.maxRadius) {
            this.radius += this.expansionRate * deltaTime;
        }

        // Drift
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // Fade out alpha
        const alpha = (this.life / this.maxLife) * 0.5;
        this.color = `rgba(0, 255, 0, ${alpha})`;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
