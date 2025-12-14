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

        // Decoy Targeting Logic
        let target = this.game.player;
        if (this.game.decoys && this.game.decoys.length > 0) {
            // Target the first decoy (all enemies focus on it)
            // Or find nearest? "tüm düşmanlar ona odaklanıyor" -> focus on it.
            // If multiple decoys? Focus on the first/latest? Let's pick first for simplicity.
            // If decoy exists, target it.
            target = this.game.decoys[0];
        }

        // Ali Invisibility Check: If target is player and player is invisible, stop logic
        if (target === this.game.player && this.game.isInvisible) {
            return; // Enemies freeze? "sabit duruyorlar"
        }

        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Apply Speed
        let currentSpeed = this.speed;
        if (this.slowTimer > 0) {
            currentSpeed *= 0.5;
            this.slowTimer -= deltaTime;
        }

        if (distance > 0) {
            this.x += (dx / distance) * currentSpeed * deltaTime;
            this.y += (dy / distance) * currentSpeed * deltaTime;
        }

        // Damage Decoy Logic (Basic proximity)
        if (this.game.decoys && this.game.decoys.includes(target) && distance < 40) {
            target.health -= this.damage * deltaTime; // DPS against decoy
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
