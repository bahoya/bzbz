class Whip {
    constructor(game, player) {
        this.game = game;
        this.player = player;
        this.active = false;
        this.width = 30; // Width of the belt
        this.maxLength = 300; // Max reach
        this.currentLength = 0;
        this.speed = 10; // Slower extension (was 20)
        this.state = 'IDLE'; // IDLE, EXTENDING, RETRACTING
        this.angle = 0;
        this.image = new Image();
        this.image.src = getAsset('assets/kemer.png');
        this.damageMultiplier = 5;
    }

    activate(targetX, targetY) {
        if (this.active) return;
        this.active = true;
        this.state = 'EXTENDING';
        this.currentLength = 0;

        // Calculate angle towards target
        const dx = targetX - (this.player.x + this.player.width / 2);
        const dy = targetY - (this.player.y + this.player.height / 2);
        this.angle = Math.atan2(dy, dx);

        this.game.soundManager.play('ulti');
    }

    update() {
        if (!this.active) return;

        if (this.state === 'EXTENDING') {
            this.currentLength += this.speed;
            this.angle += 0.42; // 4 spins over 60 frames (300/10 * 2) -> 25.13 / 60 = 0.418
            if (this.currentLength >= this.maxLength) {
                this.currentLength = this.maxLength;
                this.state = 'RETRACTING';
            }
        } else if (this.state === 'RETRACTING') {
            this.currentLength -= this.speed;
            this.angle += 0.42;
            if (this.currentLength <= 0) {
                this.currentLength = 0;
                this.active = false;
                this.state = 'IDLE';
            }
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        // Translate to player center
        const pivotX = this.player.x + this.player.width / 2;
        const pivotY = this.player.y + this.player.height / 2;
        ctx.translate(pivotX, pivotY);
        // Correct rotation for vertical image extending towards target
        // We want +Y (Height) of the image to point towards target
        ctx.rotate(this.angle - Math.PI / 2);

        // Draw belt
        // Image is vertical. We map:
        // Image Width -> World Width (this.width)
        // Image Height -> Extension Length (this.currentLength)
        if (this.image.complete) {
            // Draw centered on X (-width/2), extending along +Y (0 to currentLength)
            ctx.drawImage(this.image, -this.width / 2, 0, this.width, this.currentLength);
        } else {
            ctx.fillStyle = '#8B4513'; // Brown belt fallback
            ctx.fillRect(-this.width / 2, 0, this.width, this.currentLength);
        }

        ctx.restore();
    }
}
