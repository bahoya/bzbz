class Axe {
    constructor(game, x, y, targetX, targetY, type = 'axe', damage = null) {
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
        this.damage = damage;

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
        } else if (this.type === 'oncu') {
            this.image.src = getAsset('assets/oncu.png');
        } else if (this.type === 'top') {
            this.image.src = getAsset('assets/top.png');
        } else if (this.type === 'fuze') {
            this.image.src = getAsset('assets/fuze.png');
        } else if (this.type === 'rf') {
            this.image.src = getAsset('assets/rf.png');
        } else if (this.type === 'ziraat') {
            this.image.src = getAsset('assets/ziraat.png');
        }
    }

    update(deltaTime) {
        if (!deltaTime) deltaTime = 0.016;

        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        if (this.type !== 'fuze') {
            this.rotation += 10 * deltaTime;
        } else {
            this.rotation = Math.atan2(this.vy, this.vx) + Math.PI / 2;
        }
        // Wait, user said "görselin kendisi olduğu gibi kalmalı bükülmemeli". This might mean NO ROTATION or just Aspect Ratio.
        // Usually projectiles rotate. But "bükülmemeli" implies distortion (aspect ratio).
        // Let's assume rotation is fine if aspect ratio is kept.
        // But for "oncu", maybe user wants it upright? "bükülmemeli" -> "don't bend/distort".
        // If user meant "don't rotate", I should disable rotation for non-axe?
        // Let's keep rotation for now, but fix Aspect Ratio.

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

        if (this.image.complete && this.image.naturalWidth > 0) {
            // Calculate Aspect Ratio
            const maxDim = 60;
            const ratio = this.image.naturalWidth / this.image.naturalHeight;
            let drawW = maxDim;
            let drawH = maxDim;

            if (ratio > 1) {
                drawH = maxDim / ratio;
            } else {
                drawW = maxDim * ratio;
            }

            ctx.drawImage(this.image, -drawW / 2, -drawH / 2, drawW, drawH);
        } else {
            ctx.fillStyle = 'gray';
            ctx.fillRect(-15, -15, 30, 30);
        }
        ctx.restore();
    }
}
