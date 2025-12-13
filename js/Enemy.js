class Enemy {
    constructor(game, type) {
        this.game = game;
        this.type = type;

        // Spawn randomly in world, but not too close to player
        do {
            this.x = Math.random() * this.game.worldWidth;
            this.y = Math.random() * this.game.worldHeight;
        } while (getDistance(this.x, this.y, this.game.player.x, this.game.player.y) < 500); // Spawn further away

        this.width = 64;
        this.height = 64;
        this.radius = 25;
        this.markedForDeletion = false;

        this.setStats();

        this.image = new Image();
        this.image.src = getAsset(`assets/${this.type}.png`);
        this.mask = null;
        this.image.onload = () => {
            this.mask = createImageMask(this.image);
        };
    }

    setStats() {
        this.speed = 120; // px per second
        this.maxHealth = 20;
        this.damage = 10;

        switch (this.type) {
            case 'dgkn': this.speed = 180; this.maxHealth = 45; break;
            case 'baho': this.speed = 150; this.maxHealth = 60; break;
            case 'alik': this.speed = 220; this.maxHealth = 35; break;
            case 'ali': this.speed = 160; this.maxHealth = 50; break;
            case 'thr': this.speed = 180; this.maxHealth = 60; break;
            case 'efe': this.speed = 150; this.maxHealth = 40; break;
        }
        this.health = this.maxHealth;
    }

    update(deltaTime) {
        if (!deltaTime) deltaTime = 0.016; // Fallback

        const dx = this.game.player.x - this.x;
        const dy = this.game.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            this.x += (dx / distance) * this.speed * deltaTime;
            this.y += (dy / distance) * this.speed * deltaTime;
        }

        // Separation handled in Game.js via Grid
    }

    draw(ctx) {
        if (this.image.complete) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        ctx.fillStyle = 'black';
        ctx.fillRect(this.x, this.y - 10, this.width, 5);
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y - 10, this.width * (this.health / this.maxHealth), 5);
    }
}
