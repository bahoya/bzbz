class Camera {
    constructor(width, height) {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;
    }

    update(player, worldWidth, worldHeight) {
        this.x = player.x - this.width / 2 + player.width / 2;
        this.y = player.y - this.height / 2 + player.height / 2;

        // Clamp to world bounds
        if (this.x < 0) this.x = 0;
        if (this.y < 0) this.y = 0;
        if (this.x > worldWidth - this.width) this.x = worldWidth - this.width;
        if (this.y > worldHeight - this.height) this.y = worldHeight - this.height;
    }
}
