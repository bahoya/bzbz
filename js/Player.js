class Player {
    constructor(game, type) {
        this.game = game;
        this.type = type || 'omer'; // Default to omer
        this.x = this.game.worldWidth / 2;
        this.y = this.game.worldHeight / 2;
        this.width = 64;
        this.height = 64;
        this.speed = 300; // px/sec
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.image = new Image();
        this.image.src = getAsset(`assets/${this.type}.png`);
        this.radius = 30;
        this.mask = null;
        this.image.onload = () => {
            this.mask = createImageMask(this.image);
        };

        // Cooldown / Ammo System - Removed
        // this.maxAmmo = 8;
        // this.ammo = this.maxAmmo;
        // this.ammoRechargeRate = 2; 
        // this.lastShotTime = 0;
        // this.rechargeDelay = 0.5; 
        // this.timeSinceLastShot = 0;

        // Skills / Resources
        this.killCount = 0; // Shared resource for skills
        this.maxKillCount = 5;

        // Skill Modifiers
        this.speedMultiplier = 1;
        this.isInvulnerable = false; // For Thr's E

        // Foot Smell Ability
        this.footSmellActive = false;
        this.footSmellDuration = 3;
        this.footSmellTimer = 0;
        this.smokeSpawnTimer = 0;
    }

    updateAmmo(deltaTime) {
        // Removed
    }

    refillAmmo() {
        this.ammo = this.maxAmmo;
    }

    increaseKillCount() {
        if (this.killCount < this.maxKillCount) {
            this.killCount++;
        }
    }

    useSkill(cost) {
        if (this.killCount >= cost) {
            this.killCount -= cost;
            return true;
        }
        return false;
    }

    activateFootSmell() {
        this.footSmellActive = true;
        this.footSmellTimer = this.footSmellDuration;
    }

    activateSpeedBoost(duration) {
        this.speedMultiplier = 2; // Double speed
        this.isInvulnerable = true;
        setTimeout(() => {
            this.speedMultiplier = 1;
            this.isInvulnerable = false;
        }, duration * 1000);
    }

    resetResources() {
        this.killCount = 0;
        this.footSmellActive = false;
        this.speedMultiplier = 1;
        this.isInvulnerable = false;
    }

    update(input, deltaTime) {
        if (!deltaTime) deltaTime = 0.016;

        // Foot Smell Logic
        if (this.footSmellActive) {
            this.footSmellTimer -= deltaTime;
            if (this.footSmellTimer <= 0) {
                this.footSmellActive = false;
            }
        }

        let dx = 0;
        let dy = 0;

        // Keyboard Input
        if (input.keys.includes('w') || input.keys.includes('ArrowUp')) dy -= 1;
        if (input.keys.includes('s') || input.keys.includes('ArrowDown')) dy += 1;
        if (input.keys.includes('a') || input.keys.includes('ArrowLeft')) dx -= 1;
        if (input.keys.includes('d') || input.keys.includes('ArrowRight')) dx += 1;

        // Joystick Input
        if (this.game.mobileControls && this.game.mobileControls.active && this.game.mobileControls.joystickData.active) {
            dx += this.game.mobileControls.joystickData.x;
            dy += this.game.mobileControls.joystickData.y;
        }

        // Normalize vector if needed (to prevent fast diagonal speed)
        // But since joystick gives 0-1 values, we just need to clamp length to 1 if mixing.
        // Actually simplest is:
        if (dx !== 0 || dy !== 0) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 1) {
                dx /= dist;
                dy /= dist;
            }

            this.x += dx * this.speed * this.speedMultiplier * deltaTime;
            this.y += dy * this.speed * this.speedMultiplier * deltaTime;
        }

        // World Boundaries

        if (this.x < 0) this.x = 0;
        if (this.x > this.game.worldWidth - this.width) this.x = this.game.worldWidth - this.width;
        if (this.y < 0) this.y = 0;
        if (this.y > this.game.worldHeight - this.height) this.y = this.game.worldHeight - this.height;
    }

    draw(ctx) {
        if (this.image.complete) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = 'blue';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.game.gameOver();
        }
    }
}
