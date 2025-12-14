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
        this.clones = []; // For Thr's skill
        this.fartClouds = []; // For Alik's skill
        this.ambulances = []; // For Alik's ulti
        this.traps = []; // For Efe's skill
        this.trapSpawners = []; // Logic for delayed spawning
        this.decoys = []; // For Efe's ulti
        this.mines = []; // Baho E (Kizilay)
        this.tanks = []; // Baho R (Tank Squad)
        this.spaghettis = []; // Ali E
        this.invisibleTimer = 0; // Ali R
        this.isInvisible = false;
        this.aliECooldown = 0; // Safety cooldown
        this.spaghettiImage = new Image();
        this.spaghettiImage.src = getAsset('assets/spagetti.png');

        // Dgkn R
        this.trasActive = false;
        this.trasTimer = 0;
        this.trasEntity = null; // {x, y, speed}

        // Dgkn E Visual
        this.cigaretteVisualActive = false;
        this.cigaretteVisualTimer = 0;
        this.sigaraImage = new Image();
        this.sigaraImage.src = getAsset('assets/sigara.png');
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

                // Determine type based on player character
                let type = 'axe';
                if (this.player.type === 'thr') type = 'mayonez';
                else if (this.player.type === 'alik') type = 'oncu';
                else if (this.player.type === 'efe') type = 'top';
                else if (this.player.type === 'baho') type = 'fuze';
                else if (this.player.type === 'ali') type = 'rf';
                else if (this.player.type === 'dgkn') type = 'ziraat';

                this.throwProjectile(worldX, worldY, type);
            }

            if (key === bindings.whip && this.gameState === 'PLAYING') {
                const worldX = (this.input.mouseX / this.zoom) + this.camera.x;
                const worldY = (this.input.mouseY / this.zoom) + this.camera.y;
                this.triggerSkill('r', worldX, worldY);
            }

            if (key === bindings.smell && this.gameState === 'PLAYING') {
                this.triggerSkill('e');
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

        window.addEventListener('mousedown', e => {
            if (this.gameState !== 'PLAYING') return;

            let key;
            if (e.button === 0) key = 'LeftClick';
            else if (e.button === 2) key = 'RightClick';
            else key = `Mouse${e.button}`;

            const bindings = this.keyBindings;
            const worldX = (e.clientX / this.zoom) + this.camera.x;
            const worldY = (e.clientY / this.zoom) + this.camera.y;

            if (key === bindings.axe) {
                let type = 'axe';
                if (this.player.type === 'thr') type = 'mayonez';
                else if (this.player.type === 'alik') type = 'oncu';
                else if (this.player.type === 'efe') type = 'top';
                else if (this.player.type === 'baho') type = 'fuze';
                else if (this.player.type === 'ali') type = 'rf';
                else if (this.player.type === 'dgkn') type = 'ziraat';
                this.throwProjectile(worldX, worldY, type);
            }

            if (key === bindings.whip) {
                this.triggerSkill('r', worldX, worldY);
            }

            if (key === bindings.smell) {
                this.triggerSkill('e');
            }

            if (key === bindings.zoom) {
                this.toggleZoom();
            }
        });

        window.addEventListener('contextmenu', e => {
            e.preventDefault();
            // Zoom toggle is now handled in mousedown if bound to RightClick
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
        this.waveTimer = 10; // First wave 10 seconds (User request)
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
        // Alias for compatibility
        this.throwProjectile(targetX, targetY, 'axe');
    }

    throwProjectile(targetX, targetY, type = 'axe', damage = null) {
        this.axes.push(new Axe(this, this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, targetX, targetY, type, damage));
        if (type === 'axe' || type === 'fuze') this.soundManager.play('throw');
        else if (type === 'mayonez') this.soundManager.play('throw');
    }

    triggerSkill(action, aimX, aimY) {
        const type = this.player.type;

        // Q - Primary Attack (Often handled via click/tap directly, but here for completeness)
        // Usually Q is burst/special in this game's context? No, Q is "axe".
        if (action === 'q') {
            if (type === 'thr') {
                // Thr Q: Mayonez Burst? Or Single?
                // Current system for Q is "Burst Throw" via MobileControls.
                // Let's assume standard behavior is handled by inputs calling throwProjectile/burstThrow.
                // If we need character specific "Q" logic, we do it here.
                // MobileControls calls `fireBurstAxes`. We need to update that to support types.
            }
        }

        // E - Secondary Skill
        if (action === 'e') {
            if (type === 'omer') {
                if (this.player.useSkill(3)) {
                    this.player.activateFootSmell();
                    this.soundManager.play('duman');
                }
            } else if (type === 'thr') {
                if (this.player.useSkill(3)) {
                    this.player.activateSpeedBoost(3);
                }
            } else if (type === 'alik') {
                if (this.player.useSkill(3)) {
                    this.activateFartCloud();
                }
            } else if (type === 'efe') {
                if (this.player.useSkill(3)) {
                    this.activateTrapSpawner();
                }
            } else if (type === 'baho') {
                if (this.player.useSkill(3)) {
                    this.spawnMine();
                }
            } else if (type === 'ali') {
                if (this.player.useSkill(3)) {
                    this.spawnSpaghettis();
                }
            } else if (type === 'dgkn') {
                if (this.player.useSkill(3)) {
                    this.activateCigarette();
                }
            }
        }

        // R - Ultimate / Special
        if (action === 'r') {
            if (type === 'omer') {
                if (this.player.useSkill(5) && !this.whip.active) {
                    this.whip.activate(aimX, aimY);
                }
            } else if (type === 'thr') {
                if (this.player.useSkill(5)) {
                    this.spawnClones();
                }
            } else if (type === 'alik') {
                if (this.player.useSkill(5)) {
                    this.spawnAmbulances();
                }
            } else if (type === 'efe') {
                if (this.player.useSkill(5)) {
                    this.spawnDecoy();
                }
            } else if (type === 'baho') {
                if (this.player.useSkill(5)) {
                    this.spawnTankSquad();
                }
            } else if (type === 'ali') {
                if (this.player.useSkill(5)) {
                    this.goInvisible();
                }
            } else if (type === 'dgkn') {
                if (this.player.useSkill(5)) {
                    this.spawnTras();
                }
            }
        }
    }

    spawnClones() {
        this.soundManager.play('thrulti');
        // Spawn 3 clones around player
        for (let i = 0; i < 3; i++) {
            const angle = (i * (2 * Math.PI / 3));
            const dist = 60;
            this.clones.push({
                x: this.player.x + Math.cos(angle) * dist,
                y: this.player.y + Math.sin(angle) * dist,
                angle: angle,
                timer: 5, // Lifetime
                shootTimer: 0,
                type: 'thr'
            });
        }
    }

    updateClones(deltaTime) {
        for (let i = this.clones.length - 1; i >= 0; i--) {
            const clone = this.clones[i];
            clone.timer -= deltaTime;

            // Follow player with rotation offset
            clone.angle += deltaTime; // Rotate around player
            const dist = 60;
            clone.x = this.player.x + Math.cos(clone.angle) * dist;
            clone.y = this.player.y + Math.sin(clone.angle) * dist;

            // Shooting Logic
            clone.shootTimer += deltaTime;
            if (clone.shootTimer >= 0.2) {
                clone.shootTimer = 0;
                // Find nearest enemy
                let nearest = null;
                let minDst = Infinity;
                this.enemies.forEach(e => {
                    const d = Math.hypot(e.x - clone.x, e.y - clone.y);
                    if (d < minDst) {
                        minDst = d;
                        nearest = e;
                    }
                });

                if (nearest && minDst < 800) {
                    // Shoot mayonez from clone position
                    this.axes.push(new Axe(this, clone.x + 32, clone.y + 32, nearest.x + 32, nearest.y + 32, 'mayonez'));
                    // Sound? Maybe quiet throw
                }
            }

            if (clone.timer <= 0) {
                this.clones.splice(i, 1);
            }
        }
    }

    drawClones(ctx) {
        // We need Thr image asset reference. Using player image if type is thr.
        // Or load a specific one.
        const img = this.player.image; // Since we are Thr
        this.clones.forEach(clone => {
            ctx.save();
            ctx.globalAlpha = 0.7; // Ghostly
            ctx.drawImage(img, clone.x, clone.y, 64, 64);
            ctx.restore();
        });
    }

    activateFartCloud() {
        this.soundManager.play('duman');
        this.fartClouds.push({
            x: this.player.x + this.player.width / 2,
            y: this.player.y + this.player.height / 2,
            radius: 120,
            timer: 5,
            damageTimer: 0
        });
    }

    updateFartClouds(deltaTime) {
        for (let i = this.fartClouds.length - 1; i >= 0; i--) {
            const cloud = this.fartClouds[i];
            cloud.timer -= deltaTime;
            cloud.damageTimer += deltaTime;

            if (cloud.damageTimer >= 0.5) {
                cloud.damageTimer = 0;
                // Area Damage
                this.enemies.forEach(e => {
                    const d = Math.hypot(e.x + e.width / 2 - cloud.x, e.y + e.height / 2 - cloud.y);
                    if (d < cloud.radius + e.radius) {
                        e.health -= 20; // +40% (was 10)
                        if (e.health <= 0) e.markedForDeletion = true; // Handle drop?
                    }
                });
            }

            if (cloud.timer <= 0) this.fartClouds.splice(i, 1);
        }
    }

    drawFartClouds(ctx) {
        this.fartClouds.forEach(cloud => {
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#2ecc71'; // Green
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    spawnAmbulances() {
        this.soundManager.play('ambulans'); // Make sure sounds are loaded in SoundManager
        const corners = [
            { x: -100, y: -100 },
            { x: this.worldWidth + 100, y: -100 },
            { x: -100, y: this.worldHeight + 100 },
            { x: this.worldWidth + 100, y: this.worldHeight + 100 }
        ];

        // Target is player's current position
        const targetX = this.player.x + this.player.width / 2;
        const targetY = this.player.y + this.player.height / 2;

        corners.forEach(corner => {
            this.ambulances.push({
                x: corner.x,
                y: corner.y,
                width: 200, // Doubled size
                height: 120, // Doubled size
                targetX: targetX,
                targetY: targetY,
                speed: 800,
                image: new Image()
            });
            // Set image source
            this.ambulances[this.ambulances.length - 1].image.src = getAsset('assets/ambulans.png');
        });
    }

    updateAmbulances(deltaTime) {
        for (let i = this.ambulances.length - 1; i >= 0; i--) {
            const amb = this.ambulances[i];

            const dx = amb.targetX - amb.x;
            const dy = amb.targetY - amb.y;
            const dist = Math.hypot(dx, dy);

            if (dist < 10) {
                // Reached target (or close), continue through or delete?
                // "Ezdiği düşmanlar" means it travels. Usually passes through.
                // Let's make them travel PAST target for a bit or just delete after distance.
                // Simple: Travel until off screen again? Or just travel towards target and stop?
                // User said "4 köşeden kendisine doğru gelecek". 
                // Let's make them just move towards target. If they reach, maybe they explode or disappear.
                // Let's have them overshoot.
            }

            // Move
            // If we only store targetX/Y, we should calc vx/vy once.
            if (!amb.vx) {
                // First frame logic or store in spawn
                const angle = Math.atan2(dy, dx);
                amb.vx = Math.cos(angle) * amb.speed;
                amb.vy = Math.sin(angle) * amb.speed;
                amb.angle = angle; // For rotation?
                // Ambulans is side view? Top down.
            }

            amb.x += amb.vx * deltaTime;
            amb.y += amb.vy * deltaTime;

            // Collision with enemies
            this.enemies.forEach(e => {
                const eCx = e.x + e.width / 2;
                const eCy = e.y + e.height / 2;
                const d = Math.hypot(eCx - (amb.x + amb.width / 2), eCy - (amb.y + amb.height / 2));
                if (d < 100 + e.radius) { // Increased hit radius due to size
                    // Damage
                    e.health -= 16; // 3.2x Oncu (5) => 16
                    if (e.health <= 0) e.markedForDeletion = true;
                }
            });

            // Remove if way off target/world
            // Let's remove if distance from start is huge.
            if (amb.x < -200 || amb.x > this.worldWidth + 200 || amb.y < -200 || amb.y > this.worldHeight + 200) {
                this.ambulances.splice(i, 1);
            }
        }
    }

    drawAmbulances(ctx) {
        this.ambulances.forEach(amb => {
            ctx.save();
            ctx.translate(amb.x + amb.width / 2, amb.y + amb.height / 2);
            // Rotate based on direction, but image might be facing right by default
            // If facing right default
            ctx.rotate(Math.atan2(amb.vy, amb.vx));
            if (amb.image.complete) {
                // Flip if moving left? Rotation handles it?
                // Top down car usually faces up or right.
                // Generated image facing right.
                ctx.drawImage(amb.image, -amb.width / 2, -amb.height / 2, amb.width, amb.height);
            }
            ctx.restore();
        });
    }

    // Efe Skills
    activateTrapSpawner() {
        this.spawnTrap(); // 1st trap immediate
        this.trapSpawners.push({
            count: 2,
            timer: 0,
            delay: 2.0
        });
    }

    spawnTrap() {
        this.soundManager.play('throw');
        this.traps.push({
            x: this.player.x + this.player.width / 2,
            y: this.player.y + this.player.height / 2,
            width: 192, // 4x size (48 -> 192)
            height: 192,
            timer: 20, // Lifetime
            image: new Image()
        });
        this.traps[this.traps.length - 1].image.src = getAsset('assets/cobansalata.png');
    }

    updateTrapSpawners(deltaTime) {
        for (let i = this.trapSpawners.length - 1; i >= 0; i--) {
            const spawner = this.trapSpawners[i];
            spawner.timer += deltaTime;
            if (spawner.timer >= spawner.delay) {
                this.spawnTrap();
                spawner.count--;
                spawner.timer = 0;
            }
            if (spawner.count <= 0) {
                this.trapSpawners.splice(i, 1);
            }
        }
    }

    updateTraps(deltaTime) {
        for (let i = this.traps.length - 1; i >= 0; i--) {
            const trap = this.traps[i];
            trap.timer -= deltaTime;
            if (trap.timer <= 0) {
                this.traps.splice(i, 1);
                continue;
            }

            // check collision with enemies
            this.enemies.forEach(e => {
                const d = Math.hypot(e.x + e.width / 2 - trap.x, e.y + e.height / 2 - trap.y);
                if (d < 96 + e.radius) { // 192/2 = 96
                    // Slow Effect
                    e.slowTimer = 0.5; // Slow for 0.5s
                    e.health -= 8 * deltaTime; // DPS increased (2 -> 8)
                    if (e.health <= 0) e.markedForDeletion = true;
                }
            });
        }
    }

    drawTraps(ctx) {
        this.traps.forEach(trap => {
            if (trap.image.complete) {
                ctx.drawImage(trap.image, trap.x - 96, trap.y - 96, 192, 192);
            }
        });
    }

    spawnDecoy() {
        this.soundManager.play('ulti');
        this.decoys.push({
            x: this.player.x,
            y: this.player.y,
            width: 120,
            height: 120,
            health: 200, // Reduced from 5000 to 500
            maxHealth: 200,
            timer: 10,
            image: new Image()
        });
        this.decoys[this.decoys.length - 1].image.src = getAsset('assets/ofoedu.png');
    }

    updateDecoys(deltaTime) {
        for (let i = this.decoys.length - 1; i >= 0; i--) {
            const dec = this.decoys[i];
            dec.timer -= deltaTime;
            if (dec.health <= 0 || dec.timer <= 0) {
                this.decoys.splice(i, 1);
            }
        }
    }

    drawDecoys(ctx) {
        this.decoys.forEach(dec => {
            if (dec.image.complete) {
                ctx.drawImage(dec.image, dec.x, dec.y, dec.width, dec.height);
            }
            // HP Bar
            const percent = dec.health / dec.maxHealth;
            ctx.fillStyle = 'red';
            ctx.fillRect(dec.x, dec.y - 10, dec.width, 5);
            ctx.fillStyle = 'green';
            ctx.fillRect(dec.x, dec.y - 10, dec.width * percent, 5);
        });
    }

    // Baho Skills
    spawnMine() {
        this.mines.push({
            x: this.player.x + this.player.width / 2,
            y: this.player.y + this.player.height / 2,
            width: 64,
            height: 64,
            timer: 2.0,
            radius: 250, // Explosion radius
            image: new Image()
        });
        this.mines[this.mines.length - 1].image.src = getAsset('assets/kizilay.png');
    }

    updateMines(deltaTime) {
        for (let i = this.mines.length - 1; i >= 0; i--) {
            const mine = this.mines[i];
            mine.timer -= deltaTime;
            if (mine.timer <= 0) {
                // Explode
                this.soundManager.play('kizilay');

                // Damage Area
                this.enemies.forEach(e => {
                    const d = Math.hypot(e.x + e.width / 2 - mine.x, e.y + e.height / 2 - mine.y);
                    if (d < mine.radius) {
                        e.health = 0; // Kill
                        e.markedForDeletion = true;
                        this.score += 10;
                        this.tryDrop(e.x, e.y);
                        this.player.increaseKillCount();
                    }
                });

                // Visual? Maybe just disappear for now or spawn smoke particles
                for (let k = 0; k < 10; k++) {
                    this.smokes.push(new Smoke(mine.x + (Math.random() - 0.5) * 100, mine.y + (Math.random() - 0.5) * 100));
                }

                this.mines.splice(i, 1);
            }
        }
    }

    drawMines(ctx) {
        this.mines.forEach(mine => {
            if (mine.image.complete) {
                // Blink if about to explode?
                if (mine.timer < 0.5 && Math.floor(Date.now() / 100) % 2 === 0) {
                    // blink
                } else {
                    ctx.drawImage(mine.image, mine.x - 32, mine.y - 32, 64, 64);
                }
            }
        });
    }

    spawnTankSquad() {
        this.soundManager.play('ulti');
        // Spawn 3 tanks
        for (let i = 0; i < 3; i++) {
            const angle = (i * (2 * Math.PI / 3));
            const dist = 100;
            this.tanks.push({
                x: this.player.x + Math.cos(angle) * dist,
                y: this.player.y + Math.sin(angle) * dist,
                width: 80,
                height: 80,
                angle: angle,
                shootTimer: 0,
                image: new Image()
            });
            this.tanks[this.tanks.length - 1].image.src = getAsset('assets/tank.png');
        }
    }

    updateTanks(deltaTime) {
        // Tanks follow player
        this.tanks.forEach(tank => {
            // Rotation around player
            tank.angle += deltaTime * 0.5;
            const dist = 120;
            tank.x = this.player.x + this.player.width / 2 + Math.cos(tank.angle) * dist - tank.width / 2;
            tank.y = this.player.y + this.player.height / 2 + Math.sin(tank.angle) * dist - tank.height / 2;

            // Shoot Logic
            tank.shootTimer += deltaTime;
            if (tank.shootTimer >= 0.3) {
                tank.shootTimer = 0;
                // Find nearest
                let nearest = null;
                let minDst = Infinity;
                this.enemies.forEach(e => {
                    const d = Math.hypot(e.x - tank.x, e.y - tank.y);
                    if (d < minDst) {
                        minDst = d;
                        nearest = e;
                    }
                });

                if (nearest && minDst < 800) {
                    // Shoot Fuze, damage = 2x Player Damage
                    const dmg = this.player.damage * 2;
                    const targetX = nearest.x + nearest.width / 2;
                    const targetY = nearest.y + nearest.height / 2;
                    this.throwProjectile(targetX, targetY, 'fuze', dmg);
                }
            }
        });

        // Tanks don't die or have timer? User said "gelmeli". Usually ulti lasts for a duration.
        // Let's give them a duration (e.g. 10s) or permanent until death? 
        // User didn't specify duration. But usually skills are temporary.
        // I'll leave them permanent for now unless requested otherwise, or maybe add a timer to be safe (avoid lag).
        // Let's add a timer for balance. 15s.
        // Wait, loop above didn't use index, so splicing is hard.
        // Let's iterate backwards.
    }

    // Better implementation of updateTanks for expiration:
    updateTanksSafe(deltaTime) {
        for (let i = this.tanks.length - 1; i >= 0; i--) {
            const tank = this.tanks[i];
            // Add timer property if not exists (assume added in spawn or default)
            if (tank.timer === undefined) tank.timer = 8; // Duration 8s
            tank.timer -= deltaTime;

            // ... logic same as above ...
            tank.angle += deltaTime * 0.5;
            const dist = 120;
            tank.x = this.player.x + this.player.width / 2 + Math.cos(tank.angle) * dist - tank.width / 2;
            tank.y = this.player.y + this.player.height / 2 + Math.sin(tank.angle) * dist - tank.height / 2;

            tank.shootTimer += deltaTime;
            if (tank.shootTimer >= 0.4) { // Fire rate 0.4s
                tank.shootTimer = 0;
                let nearest = null;
                let minDst = Infinity;
                this.enemies.forEach(e => {
                    const d = Math.hypot(e.x - tank.x, e.y - tank.y);
                    if (d < minDst) { minDst = d; nearest = e; }
                });
                if (nearest && minDst < 800) {
                    const dmg = this.player.damage * 2;
                    this.throwProjectile(nearest.x + nearest.width / 2, nearest.y + nearest.height / 2, 'fuze', dmg);
                }
            }

            if (tank.timer <= 0) {
                this.tanks.splice(i, 1);
            }
        }
    }

    drawTanks(ctx) {
        this.tanks.forEach(tank => {
            if (tank.image.complete) {
                // Draw tank
                ctx.save();
                ctx.translate(tank.x + tank.width / 2, tank.y + tank.height / 2);
                // No specific rotation logic for image facing target requested, just draw
                // Maybe flip if on left side of player?
                ctx.drawImage(tank.image, -tank.width / 2, -tank.height / 2, tank.width, tank.height);
                ctx.restore();
            }
        });
    }

    // Ali Skills
    spawnSpaghettis() {
        if (this.aliECooldown > 0) return;
        if (this.spaghettis.length > 50) return;

        this.soundManager.play('throw');
        this.aliECooldown = 0.5; // 0.5s local cooldown

        // Updated for 6 spaghettis (0, 60, 120, 180, 240, 300)
        const directions = [];
        for (let i = 0; i < 6; i++) {
            directions.push(i * (Math.PI / 3)); // 60 degrees in radians
        }

        directions.forEach(angle => {
            this.spaghettis.push({
                x: this.player.x + this.player.width / 2,
                y: this.player.y + this.player.height / 2,
                width: 48,
                height: 48,
                angle: angle,
                speed: 600,
                state: 'out',
                image: this.spaghettiImage // Use shared image
            });
        });
    }

    updateSpaghettis(deltaTime) {
        for (let i = this.spaghettis.length - 1; i >= 0; i--) {
            const spag = this.spaghettis[i];

            if (spag.state === 'out') {
                spag.x += Math.cos(spag.angle) * spag.speed * deltaTime;
                spag.y += Math.sin(spag.angle) * spag.speed * deltaTime;

                spag.speed -= 400 * deltaTime;
                spag.angle += 2 * deltaTime; // Curve

                if (spag.speed <= 0) {
                    spag.state = 'return';
                    spag.speed = 0;
                }
            } else if (spag.state === 'return') {
                const dx = (this.player.x + this.player.width / 2) - spag.x;
                const dy = (this.player.y + this.player.height / 2) - spag.y;
                const angle = Math.atan2(dy, dx);

                spag.speed += 600 * deltaTime;
                spag.x += Math.cos(angle) * spag.speed * deltaTime;
                spag.y += Math.sin(angle) * spag.speed * deltaTime;

                spag.angle += 10 * deltaTime;

                const dist = Math.hypot(dx, dy);
                if (dist < 50) {
                    this.spaghettis.splice(i, 1);
                    continue;
                }
            }

            // Damage logic
            this.enemies.forEach(e => {
                const d = Math.hypot(e.x + e.width / 2 - spag.x, e.y + e.height / 2 - spag.y);
                if (d < 30 + e.radius) {
                    // Buffed: 20% increase on top of 180 -> 216
                    e.health -= 216 * deltaTime;
                    if (e.health <= 0) e.markedForDeletion = true;
                }
            });
        }
    }

    drawSpaghettis(ctx) {
        this.spaghettis.forEach(spag => {
            if (spag.image.complete) {
                ctx.save();
                ctx.translate(spag.x, spag.y);
                ctx.rotate(spag.angle);
                ctx.drawImage(spag.image, -24, -24, 48, 48);
                ctx.restore();
            }
        });
    }

    goInvisible() {
        if (this.isInvisible) return;
        this.soundManager.play('ulti');
        this.isInvisible = true;
        this.invisibleTimer = 3.5;
    }

    // Dgkn Skills
    activateCigarette() {
        this.soundManager.play('sigara');
        // Enable cigarette icon visual
        this.cigaretteVisualActive = true;
        this.cigaretteVisualTimer = 4.0; // Lasts 4 seconds

        // Spawn smoke cloud
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 120; // Increased spread (was 80)
            const sx = this.player.x + this.player.width / 2 + Math.cos(angle) * dist;
            const sy = this.player.y + this.player.height / 2 + Math.sin(angle) * dist;
            // Pass 'this.player' as owner so smoke follows
            this.smokes.push(new Smoke(sx, sy, 'cigarette', this.player));
        }
    }

    spawnTras() {
        this.soundManager.play('tras');
        this.trasActive = true;
        this.trasTimer = 10.0;
        this.trasEntity = {
            x: this.player.x,
            y: this.player.y,
            width: 80,
            height: 80,
            speed: 300,
            image: new Image()
        };
        this.trasEntity.image.src = getAsset('assets/tras.png');
    }

    updateTras(deltaTime) {
        if (!this.trasActive || !this.trasEntity) return;

        this.trasTimer -= deltaTime;
        if (this.trasTimer <= 0) {
            this.trasActive = false;
            return;
        }

        // Find nearest enemy
        let nearest = null;
        let minDst = Infinity;
        // Optimization: Check enemies in grid? Or iterate all if <100.
        // Iterate all is safer for "nearest".
        this.enemies.forEach(e => {
            const d = Math.hypot(e.x - this.trasEntity.x, e.y - this.trasEntity.y);
            if (d < minDst) {
                minDst = d;
                nearest = e;
            }
        });

        if (nearest) {
            const dx = nearest.x - this.trasEntity.x;
            const dy = nearest.y - this.trasEntity.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 0) {
                this.trasEntity.x += (dx / dist) * this.trasEntity.speed * deltaTime;
                this.trasEntity.y += (dy / dist) * this.trasEntity.speed * deltaTime;
            }

            // Damage functionality
            // "gidip değecek, ölürse diğer en yakın düşmana"
            // Continuous damage or huge burst on contact?
            // "değecek" implies contact. Let's do high continuous damage or instantaneous tick.
            // 4x Player Damage (usually player damage is projectile damage? Player struct doesn't have "damage" prop explicitly, Axe does. Player damage is usually killCount related? No.)
            // Assuming base damage ~20. 4x = 80.
            // Let's use 80 * deltaTime (DPS) ? No, that's weak.
            // If it touches, it should shred. 
            // "Ziraat'in 4 katı hasarı". Ziraat is projectile. Default projectile damage usually 20-ish? 
            // Let's assume 100 DPS.
            if (dist < 40 + nearest.radius) {
                nearest.health -= 150 * deltaTime; // Reduced from 200 (3x Ziraat approx)
                if (nearest.health <= 0) nearest.markedForDeletion = true;
            }
        } else {
            // Follow player if no enemies
            const dx = this.player.x - this.trasEntity.x;
            const dy = this.player.y - this.trasEntity.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 10) {
                this.trasEntity.x += (dx / dist) * this.trasEntity.speed * deltaTime;
                this.trasEntity.y += (dy / dist) * this.trasEntity.speed * deltaTime;
            }
        }
    }

    drawTras(ctx) {
        if (this.trasActive && this.trasEntity && this.trasEntity.image.complete) {
            const maxDim = 60;
            const ratio = this.trasEntity.image.naturalWidth / this.trasEntity.image.naturalHeight;
            let drawW = maxDim;
            let drawH = maxDim;
            if (ratio > 1) {
                drawH = maxDim / ratio;
            } else {
                drawW = maxDim * ratio;
            }
            // Center the draw
            const drawX = this.trasEntity.x + (maxDim - drawW) / 2;
            const drawY = this.trasEntity.y + (maxDim - drawH) / 2;
            ctx.drawImage(this.trasEntity.image, drawX, drawY, drawW, drawH);
        }
    }

    mobileInput(action, angle) {
        if (this.gameState !== 'PLAYING') return;

        // Calc target from angle (for R/Whip or future aiming)
        const targetX = this.player.x + this.player.width / 2 + Math.cos(angle) * dist;
        const targetY = this.player.y + this.player.height / 2 + Math.sin(angle) * dist;

        this.triggerSkill(action, targetX, targetY);
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

            // Custom Wave Durations
            if (this.wave === 2) {
                this.waveTimer = 15; // Wave 2: 15 seconds
            } else {
                this.waveTimer = 20 + (this.wave * 3); // Default scaling for others
            }

            // Enemies persist now

            this.ui.showWaveAnnouncement(this.wave);
        }

        // Spawning
        this.spawnTimer += deltaTime;
        const enemiesToSpawn = 5 * Math.pow(2, this.wave - 1);

        // Spawn faster to accommodate higher counts in shorter times
        let waveDuration;
        if (this.wave === 1) waveDuration = 10;
        else if (this.wave === 2) waveDuration = 15;
        else waveDuration = 20 + (this.wave * 3);

        // Ensure initial wave timer matches custom logic if just started (handled in constructor?)
        // In constructor loop(0) starts. waveTimer should be init in constructor.

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
        this.updateClones(deltaTime / 1000); // Clones
        this.updateFartClouds(deltaTime / 1000); // Alik E
        this.updateAmbulances(deltaTime / 1000); // Alik R

        this.updateTraps(deltaTime / 1000); // Efe E
        this.updateTrapSpawners(deltaTime / 1000); // Efe E Spawn Logic
        this.updateDecoys(deltaTime / 1000); // Efe R

        this.updateMines(deltaTime / 1000); // Baho E
        this.updateTanksSafe(deltaTime / 1000); // Baho R (Using Safe version)

        this.updateSpaghettis(deltaTime / 1000); // Ali E
        this.updateTras(deltaTime / 1000); // Dgkn R
        if (this.aliECooldown > 0) this.aliECooldown -= deltaTime / 1000;
        if (this.cigaretteVisualTimer > 0) this.cigaretteVisualTimer -= deltaTime / 1000;

        if (this.isInvisible) {
            this.invisibleTimer -= deltaTime / 1000;
            if (this.invisibleTimer <= 0) {
                this.isInvisible = false;
            }
        }

        this.axes = this.axes.filter(axe => !axe.markedForDeletion);
        this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);
        this.drops = this.drops.filter(drop => !drop.markedForDeletion);
        this.smokes = this.smokes.filter(smoke => !smoke.markedForDeletion);
        // Clean clones/farts/ambulances/traps/decoys handled in their update methods

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
                        const dmg = axe.damage || 5; // Default 5 (Half axe damage)
                        entity.health -= dmg;
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
                        // Use dynamic damage from Smoke instance, default to 13 if missing
                        const dps = smoke.damagePerSecond || 13;
                        entity.health -= dps * (deltaTime / 1000);
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
                if (this.player.isInvulnerable) return; // Thr's Speed Boost
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

            if (this.isInvisible) this.ctx.globalAlpha = 0.5;
            this.player.draw(this.ctx);
            this.ctx.globalAlpha = 1.0;

            if (this.cigaretteVisualTimer > 0 && this.sigaraImage.complete) {
                this.ctx.drawImage(this.sigaraImage, this.player.x + 40, this.player.y + 40, 24, 24);
            }

            this.drawClones(this.ctx); // Clones
            this.drawFartClouds(this.ctx); // Alik E
            this.drawAmbulances(this.ctx); // Alik R
            this.drawTraps(this.ctx); // Efe E
            this.drawDecoys(this.ctx); // Efe R
            this.drawMines(this.ctx); // Baho E
            this.drawTanks(this.ctx); // Baho R
            this.drawSpaghettis(this.ctx); // Ali E
            this.drawTras(this.ctx); // Dgkn R
            this.whip.draw(this.ctx);
            this.enemies.forEach(enemy => enemy.draw(this.ctx));
            this.axes.forEach(axe => axe.draw(this.ctx));

            this.ctx.restore();

            this.ui.drawMinimap(this.ctx);
        }
    }

    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        let deltaTime = timestamp - this.lastTime || 0;
        if (deltaTime > 100) deltaTime = 100; // Cap at 0.1s to prevent physics explosion
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame(this.loop.bind(this));
    }
}
