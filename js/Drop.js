class Drop {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'stamina' or 'health'
        this.width = 20;
        this.height = 20;
        this.markedForDeletion = false;
        this.image = new Image();
        // ...
        if (type === 'health') {
            this.image.src = getAsset('assets/heart.png');
        }
        this.pulse = 0;
    }

    draw(ctx) {
        if (this.type === 'stamina') {
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'gold';
            ctx.fillStyle = 'yellow';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            // Removed stroke/complex draw for cleaner "orb" look
        } else if (this.type === 'health') {
            const scale = 1 + Math.sin(this.pulse) * 0.2;
            this.pulse += 0.03;

            if (this.image.complete) {
                const w = 30 * scale;
                const h = 30 * scale;
                ctx.drawImage(this.image, this.x - w / 2, this.y - h / 2, w, h);
            } else {
                ctx.fillStyle = 'red';
                ctx.beginPath();
                ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}
