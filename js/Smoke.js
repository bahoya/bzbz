class Smoke {
    constructor(x, y, type = 'smell', owner = null) {
        this.x = x;
        this.y = y;
        this.type = type; // 'smell' or 'cigarette'
        this.owner = owner;

        if (this.owner) {
            this.offsetX = this.x - this.owner.x;
            this.offsetY = this.y - this.owner.y;
        }

        this.radius = 10;
        this.maxRadius = 50;
        this.life = 3; // Seconds
        this.maxLife = 3;
        this.expansionRate = 20; // Radius expansion per second
        this.markedForDeletion = false;

        if (this.type === 'cigarette') {
            this.baseColor = '128, 128, 128'; // Gray
            // Reduced damage by 60% relative to 13 (so 40% of 13 = 5.2)
            this.damagePerSecond = 5.2;

            // Area Buff
            this.maxRadius = 160; // Was 120 (Original 50)
            this.expansionRate = 50; // Was 40 (Original 20)
        } else {
            this.baseColor = '0, 255, 0'; // Green
            this.damagePerSecond = 13; // Base damage
        }
        this.color = `rgba(${this.baseColor}, 0.5)`;

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

        // Drift or Follow
        if (this.owner && this.type === 'cigarette') {
            this.x = this.owner.x + this.offsetX;
            this.y = this.owner.y + this.offsetY;
        } else {
            this.x += this.vx * deltaTime;
            this.y += this.vy * deltaTime;
        }

        // Fade out alpha
        const alpha = (this.life / this.maxLife) * 0.5;
        this.color = `rgba(${this.baseColor}, ${alpha})`;
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
