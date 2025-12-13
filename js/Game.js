class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;

        // World Dimensions
        this.worldWidth = 2200;
        this.worldHeight = 2200;

        this.zoom = 1;

        // Mobile Zoom Check
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.targetZoom = isMobile ? 0.7 : 1;
        if (isMobile) this.zoom = 0.7; // Start zoomed out instantly

        this.camera = new Camera(this.width, this.height);
        this.ui = new UI(this);
        this.soundManager = new SoundManager();

        this.soundManager.load();

        this.grid = new Grid(this.worldWidth, this.worldHeight, 200); // 200px cells

        // Initialize Mobile Controls
        this.mobileControls = new MobileControls(this);

        this.input = { keys: [], mouseX: 0, mouseY: 0 };
        // ... (rest of constructor)

        // In start():
        this.mobileControls.show();
        this.gameState = 'PLAYING';


        // Key Bindings
        this.keyBindings = {
            axe: 'q',
            smell: 'e',
            whip: 'r',
            zoom: 'RightClick' // Special case
        };

        window.addEventListener('resize', () => {
            this.width = this.canvas.width = window.innerWidth;
            this.height = this.canvas.height = window.innerHeight;
            this.camera.width = this.width;
            this.camera.height = this.height;
        });

        window.addEventListener('keydown', e => {
            const k = e.key.toLowerCase();
            if (this.input.keys.indexOf(k) === -1) this.input.keys.push(k);

            const key = e.key.toLowerCase();
            const bindings = this.keyBindings;

            if (key === bindings.axe && this.gameState === 'PLAYING') {
                const worldX = (this.input.mouseX / this.zoom) + this.camera.x;
                const worldY = (this.input.mouseY / this.zoom) + this.camera.y;
                this.throwAxe(worldX, worldY);
            }

            if (key === bindings.whip && this.gameState === 'PLAYING') {
                if (this.player.useSkill(5) && !this.whip.active) {
                    const worldX = (this.input.mouseX / this.zoom) + this.camera.x;
                    const worldY = (this.input.mouseY / this.zoom) + this.camera.y;
                    this.whip.activate(worldX, worldY);
                }
            }

            if (key === bindings.smell && this.gameState === 'PLAYING') {
                if (this.player.useSkill(3)) {
                    this.player.activateFootSmell();
                    this.soundManager.play('duman');
                }
            }
        });

        window.addEventListener('keyup', e => {
            const k = e.key.toLowerCase();
            const index = this.input.keys.indexOf(k);
            if (index > -1) this.input.keys.splice(index, 1);
        });

        window.addEventListener('mousemove', e => {
            this.input.mouseX = e.clientX;
            this.input.mouseY = e.clientY;
        });

        window.addEventListener('contextmenu', e => {
            e.preventDefault();
            if (this.keyBindings.zoom === 'RightClick') {
                this.toggleZoom();
            }
        });

        // Check for zoom key in keydown (if remapped to key)
        // Note: added check in keydown listener above? No I didn't. 
        // I need to add it or just handle it here. 
        // I will add a method toggleZoom() to clean this up.

        this.gameState = 'MENU';
        this.ui.showStartScreen();

        this.loop(0);
    }

    start() {
        this.player = new Player(this, this.selectedCharacter || 'omer');
        this.whip = new Whip(this, this.player);
        this.enemies = [];
        this.axes = [];
        this.drops = [];
        this.obstacles = [];
        this.smokes = []; // Smoke particles
        this.score = 0;
        this.wave = 1;
        this.waveTimer = 30;
        this.spawnTimer = 0;
        this.spawnInterval = 2000;
        this.gameState = 'PLAYING';
        this.ui.showHUD();
        this.mobileControls.show(); // Show if active

        this.soundManager.play('music');

        this.generateObstacles();
        this.ui.showWaveAnnouncement(1);
    }

    // New Helper for Character Selection
    getAvailableCharacters() {
        return ['omer', 'ali', 'alik', 'baho', 'dgkn', 'efe', 'thr'];
    }

    setSelectedCharacter(charName) {
        this.selectedCharacter = charName;
    }

    generateObstacles() {
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * (this.worldWidth - 100);
            const y = Math.random() * (this.worldHeight - 100);
            if (getDistance(x, y, this.player.x, this.player.y) > 200) {
                this.obstacles.push(new Obstacle(x, y, Math.random() < 0.7 ? 'tree' : 'rock'));
            }
        }
    }

    gameOver() {
        this.soundManager.play('playerolum');
        this.gameState = 'GAME_OVER';
        this.ui.showGameOverScreen();
    }

    toggleZoom() {
        if (this.targetZoom === 1) {
            this.targetZoom = 0.7;
        } else {
            this.targetZoom = 1;
        }
    }

    async burstThrow(angle) {
        // Fire 10 axes in rapid succession
        const speed = 20; // Distance multiplier for target
        // We know direction angle.
        // Axe constructor takes targetX, targetY.
        // We can simulate targetX/Y based on angle.
        // Axe vector: targetX - startX.

        const count = 10;
        const delay = 100; // ms

        for (let i = 0; i < count; i++) {
            const startX = this.player.x + this.player.width / 2;
            const startY = this.player.y + this.player.height / 2;

            // Calculate a target far away in the direction of angle
            const targetX = startX + Math.cos(angle) * 1000;
            const targetY = startY + Math.sin(angle) * 1000;

            this.throwAxe(targetX, targetY);
            await new Promise(r => setTimeout(r, delay));
        }
    }

    throwAxe(targetX, targetY) {
        // Infinite Ammo
        this.axes.push(new Axe(this, this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, targetX, targetY));
        this.soundManager.play('throw');
    }

    mobileInput(action, angle) {
        if (this.gameState !== 'PLAYING') return;

        if (action === 'q') {
            // Mapping Q for mobile if needed, but we have burstThrow
        } else if (action === 'e') { // Smell
            if (this.keyBindings.smell && this.player.useSkill(3)) {
                this.player.activateFootSmell();
                this.soundManager.play('duman');
            }
        } else if (action === 'r') { // Whip
            if (this.player.useSkill(5) && !this.whip.active) {
                // Calc target from angle
                const dist = 100;
                const targetX = this.player.x + this.player.width / 2 + Math.cos(angle) * dist;
                const targetY = this.player.y + this.player.height / 2 + Math.sin(angle) * dist;
                this.whip.activate(targetX, targetY);
            }
        }
    }

    update(deltaTime) {
        if (this.gameState !== 'PLAYING') return;

        // Smooth Zoom
        this.zoom += (this.targetZoom - this.zoom) * 0.1;

        // Update Player Ammo - Removed
        // this.player.updateAmmo(deltaTime / 1000); 

        // Wave Logic
        this.waveTimer -= deltaTime / 1000;
        if (this.waveTimer <= 0) {
            this.wave++;
            this.waveTimer = 20 + (this.wave * 3); // Shortened duration

            // Enemies persist now

            this.ui.showWaveAnnouncement(this.wave);
        }

        // Spawning
        this.spawnTimer += deltaTime;
        const enemiesToSpawn = 5 * Math.pow(2, this.wave - 1);

        // Spawn faster to accommodate higher counts
        // Calculate approx interval needed: 40s / 100 enemies = 400ms.
        // 40s / 1000 enemies = 40ms.
        const waveDuration = 30 + (this.wave * 5);
        const neededRate = (waveDuration * 1000) / enemiesToSpawn;
        const currentSpawnRate = Math.max(30, neededRate * 0.8); // 0.8 to be safe

        if (this.spawnTimer > currentSpawnRate && this.enemies.length < enemiesToSpawn) {
            this.spawnEnemy();
            this.spawnTimer = 0;
        }

        this.player.update(this.input, deltaTime / 1000);

        // Smoke Spawning
        if (this.player.footSmellActive) {
            this.player.smokeSpawnTimer += deltaTime;
            if (this.player.smokeSpawnTimer > 200) { // Spawn every 200ms (Reduced from 100ms)
                this.smokes.push(new Smoke(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2));
                this.player.smokeSpawnTimer = 0;
            }
        }

        this.camera.width = this.width / this.zoom;
        this.camera.height = this.height / this.zoom;
        this.camera.update(this.player, this.worldWidth, this.worldHeight);

        this.enemies.forEach(enemy => enemy.update(deltaTime / 1000));
        this.axes.forEach(axe => axe.update(deltaTime / 1000));
        this.whip.update(); // Update Whip
        this.smokes.forEach(smoke => smoke.update(deltaTime / 1000));

        this.axes = this.axes.filter(axe => !axe.markedForDeletion);
        this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);
        this.drops = this.drops.filter(drop => !drop.markedForDeletion);
        this.smokes = this.smokes.filter(smoke => !smoke.markedForDeletion);

        this.checkCollisions(deltaTime);
        this.ui.update();
    }

    spawnEnemy() {
        const allChars = this.getAvailableCharacters();
        // Exclude selected player character AND 'player' (if it exists in list, though list is names)
        // Check if selectedCharacter is set, default to 'omer'.
        const myChar = this.selectedCharacter || 'omer';

        const enemyPool = allChars.filter(c => c !== myChar);

        if (enemyPool.length > 0) {
            const type = enemyPool[Math.floor(Math.random() * enemyPool.length)];
            this.enemies.push(new Enemy(this, type));
        }
    }

    checkCollisions(deltaTime) {
        // 1. Clear and Populate Grid
        this.grid.clear();
        this.enemies.forEach(e => this.grid.insert(e));
        this.obstacles.forEach(o => this.grid.insert(o));

        // Pre-calculate Player Center
        const pCx = this.player.x + this.player.width / 2;
        const pCy = this.player.y + this.player.height / 2;

        // 2. Axes vs Enemies/Obstacles
        this.axes.forEach(axe => {
            const potentials = this.grid.retrieve(axe);
            potentials.forEach(entity => {
                if (entity instanceof Enemy) {
                    if (axe.markedForDeletion || entity.markedForDeletion) return;
                    const eCx = entity.x + entity.width / 2; // Enemy Center (roughly, visual is centered at x,y?)
                    // Enemy draw: ctx.fillRect(this.x, ...) -> x is Top-Left.
                    // So Center is x + w/2.
                    const eCy = entity.y + entity.height / 2;

                    const dist = Math.hypot(axe.x - eCx, axe.y - eCy);
                    if (dist < axe.radius + entity.radius) {
                        entity.health -= 5; // Reduced damage from 10 to 5
                        axe.markedForDeletion = true;
                        if (entity.health <= 0 && !entity.markedForDeletion) {
                            entity.markedForDeletion = true;
                            this.score += 10;
                            this.tryDrop(entity.x, entity.y);

                            // Specific Death Sound
                            const soundName = `${entity.type}olum`;
                            this.soundManager.play(soundName);
                            // Fallback if not loaded? SoundManager handles it safely if not found? 
                            // Our SoundManager checks if sound exists.

                            this.player.increaseKillCount();
                        }
                    }
                } else if (entity instanceof Obstacle) {
                    if (axe.markedForDeletion) return;
                    const oCx = entity.x + entity.width / 2;
                    const oCy = entity.y + entity.height / 2;
                    const dist = Math.hypot(axe.x - oCx, axe.y - oCy);
                    if (dist < axe.radius + 30) {
                        axe.markedForDeletion = true;
                    }
                }
            });
        });

        // 3. Smokes vs Enemies
        this.smokes.forEach(smoke => {
            const potentials = this.grid.retrieve(smoke);
            potentials.forEach(entity => {
                if (entity instanceof Enemy) {
                    const eCx = entity.x + entity.width / 2;
                    const eCy = entity.y + entity.height / 2;
                    const dist = Math.hypot(smoke.x - eCx, smoke.y - eCy);
                    if (dist < smoke.radius + entity.radius) {
                        entity.health -= 13 * (deltaTime / 1000); // DOT Increased by 50% more (was 9)
                        if (entity.health <= 0 && !entity.markedForDeletion) {
                            entity.markedForDeletion = true;
                            this.score += 10;
                            this.tryDrop(entity.x, entity.y);

                            // Specific Death Sound
                            const soundName = `${entity.type}olum`;
                            this.soundManager.play(soundName);

                            this.player.increaseKillCount();
                        }
                    }
                }
            });
        });

        // 4. Player vs Enemies/Obstacles
        const playerPotentials = this.grid.retrieve(this.player);
        playerPotentials.forEach(entity => {
            if (entity instanceof Enemy) {
                const eCx = entity.x + entity.width / 2;
                const eCy = entity.y + entity.height / 2;
                const dist = Math.hypot(pCx - eCx, pCy - eCy);
                if (dist < this.player.radius + entity.radius) {
                    this.player.takeDamage(0.5);
                }
            } else if (entity instanceof Obstacle) {
                if (checkPixelCollision(this.player, entity)) {
                    const oCx = entity.x + entity.width / 2;
                    const oCy = entity.y + entity.height / 2;
                    const dx = pCx - oCx;
                    const dy = pCy - oCy;
                    const angle = Math.atan2(dy, dx);
                    this.player.x += Math.cos(angle) * 2;
                    this.player.y += Math.sin(angle) * 2;
                }
            }
        });

        // 5. Whip Collision
        if (this.whip.active && this.whip.state === 'EXTENDING') {
            this.enemies.forEach(enemy => {
                if (enemy.markedForDeletion) return;
                const eCx = enemy.x + enemy.width / 2;
                const eCy = enemy.y + enemy.height / 2;
                const dx = eCx - pCx;
                const dy = eCy - pCy;
                const dist = Math.hypot(dx, dy);

                if (dist < this.whip.currentLength + enemy.radius) {
                    let enemyAngle = Math.atan2(dy, dx);
                    let diff = enemyAngle - this.whip.angle;
                    while (diff > Math.PI) diff -= Math.PI * 2;
                    while (diff < -Math.PI) diff += Math.PI * 2;

                    if (Math.abs(diff) < 0.2) {
                        enemy.health -= 10 * this.whip.damageMultiplier;
                        if (enemy.health <= 0 && !enemy.markedForDeletion) {
                            enemy.markedForDeletion = true;
                            this.score += 10;
                            this.tryDrop(enemy.x, enemy.y);

                            // Specific Death Sound
                            const soundName = `${enemy.type}olum`;
                            this.soundManager.play(soundName);

                            this.player.increaseKillCount();
                        }
                    }
                }
            });
        }

        // 6. Drop Collection (Corrected Logic)
        this.drops.forEach(drop => {
            // Drop x,y IS center (based on draw methods)
            const dist = Math.hypot(pCx - drop.x, pCy - drop.y);

            // Pickup Radius: Player Radius (30) + Large Margin (30) = 60
            if (dist < 60) {
                if (drop.type === 'health') {
                    if (this.player.health < this.player.maxHealth) {
                        this.player.health = Math.min(this.player.health + 20, this.player.maxHealth);
                        drop.markedForDeletion = true;
                    }
                }
                // Stamina Removed
                /* else if (drop.type === 'stamina') {
                    if (this.player.ammo < this.player.maxAmmo) {
                        this.player.refillAmmo();
                        drop.markedForDeletion = true;
                    }
                } */
            }
        });

        // 7. Enemy Separation (Using Grid)
        this.enemies.forEach(enemy => {
            const eCx = enemy.x + enemy.width / 2;
            const eCy = enemy.y + enemy.height / 2;

            const neighbors = this.grid.retrieve(enemy);
            neighbors.forEach(other => {
                if (other instanceof Enemy && other !== enemy) {
                    const oCx = other.x + other.width / 2;
                    const oCy = other.y + other.height / 2;

                    const distX = eCx - oCx;
                    const distY = eCy - oCy;
                    const dist = Math.hypot(distX, distY);

                    if (dist < 30 && dist > 0) {
                        enemy.x += (distX / dist) * 100 * deltaTime / 1000;
                        enemy.y += (distY / dist) * 100 * deltaTime / 1000;
                    }
                } else if (other instanceof Obstacle) {
                    const oCx = other.x + other.width / 2;
                    const oCy = other.y + other.height / 2;
                    const dist = Math.hypot(eCx - oCx, eCy - oCy);

                    if (dist < enemy.radius + 40) {
                        const dx = eCx - oCx;
                        const dy = eCy - oCy;
                        const angle = Math.atan2(dy, dx);
                        enemy.x += Math.cos(angle) * 1;
                        enemy.y += Math.sin(angle) * 1;
                    }
                }
            });
        });
    }

    tryDrop(x, y) {
        if (Math.random() < 0.1) { // Reduced drop rate slightly since no stamina
            // Only health now
            this.drops.push(new Drop(x, y, 'health'));
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        if (this.gameState === 'PLAYING') {
            this.ctx.save();

            this.ctx.scale(this.zoom, this.zoom);
            this.ctx.translate(-this.camera.x, -this.camera.y);

            this.ctx.strokeStyle = 'white';
            this.ctx.strokeRect(0, 0, this.worldWidth, this.worldHeight);

            this.obstacles.forEach(obstacle => obstacle.draw(this.ctx));
            this.drops.forEach(drop => drop.draw(this.ctx));
            this.smokes.forEach(smoke => smoke.draw(this.ctx));
            this.player.draw(this.ctx);
            this.whip.draw(this.ctx);
            this.enemies.forEach(enemy => enemy.draw(this.ctx));
            this.axes.forEach(axe => axe.draw(this.ctx));

            this.ctx.restore();

            this.ui.drawMinimap(this.ctx);
        }
    }

    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const deltaTime = timestamp - this.lastTime || 0;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame(this.loop.bind(this));
    }
}
