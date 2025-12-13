class UI {
    constructor(game) {
        this.game = game;
        this.hud = document.getElementById('hud');
        this.healthBar = document.getElementById('health-bar');
        this.ultiBar = document.getElementById('ulti-bar');
        this.scoreEl = document.getElementById('score');
        this.waveEl = document.getElementById('wave');
        this.timerEl = document.getElementById('timer');

        this.startScreen = document.getElementById('start-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.startBtn = document.getElementById('start-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.finalScoreEl = document.getElementById('final-score');
        this.finalWaveEl = document.getElementById('final-wave');

        // Character Selection
        this.characters = this.game.getAvailableCharacters(); // ['omer', 'ali', ...]
        this.charIndex = 0;
        this.charImage = document.getElementById('char-image');
        this.charName = document.getElementById('char-name');

        // Initial Display
        this.updateCharDisplay();
        this.game.setSelectedCharacter(this.characters[this.charIndex]); // Default

        document.getElementById('char-prev').addEventListener('click', () => {
            this.charIndex--;
            if (this.charIndex < 0) this.charIndex = this.characters.length - 1;
            this.updateSelector();
        });

        document.getElementById('char-next').addEventListener('click', () => {
            this.charIndex++;
            if (this.charIndex >= this.characters.length) this.charIndex = 0;
            this.updateSelector();
        });

        // Volume Control
        const volSlider = document.getElementById('music-volume');
        const volDisplay = document.getElementById('volume-value');
        if (volSlider) {
            volSlider.addEventListener('input', (e) => {
                const vol = parseFloat(e.target.value);
                this.game.soundManager.setMusicVolume(vol);
                if (volDisplay) volDisplay.innerText = `${Math.round(vol * 100)}%`;
            });
        }

        // Settings Modal
        const settingsBtn = document.getElementById('settings-btn');
        const settingsModal = document.getElementById('settings-modal');
        const closeSettingsBtn = document.getElementById('close-settings-btn');

        if (settingsBtn && settingsModal && closeSettingsBtn) {
            settingsBtn.addEventListener('click', () => {
                settingsModal.classList.remove('hidden');
            });

            closeSettingsBtn.addEventListener('click', () => {
                settingsModal.classList.add('hidden');
            });
        }

        // Key Bindings
        this.bindBtns = document.querySelectorAll('.bind-btn');
        this.bindBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                btn.innerText = '...';
                btn.classList.add('waiting');

                const handleBind = (e) => {
                    e.preventDefault();
                    let newKey;

                    if (e.type === 'contextmenu') {
                        newKey = 'RightClick';
                    } else {
                        newKey = e.key.toLowerCase();
                    }

                    // Validation: Uniqueness
                    for (const [act, key] of Object.entries(this.game.keyBindings)) {
                        if (key === newKey && act !== action) {
                            alert(`Bu tuş zaten ${act.toUpperCase()} için kullanılıyor!`);
                            btn.innerText = this.game.keyBindings[action].toUpperCase();
                            btn.classList.remove('waiting');
                            document.removeEventListener('keydown', handleBind);
                            document.removeEventListener('contextmenu', handleBind);
                            return;
                        }
                    }

                    // Update Binding
                    this.game.keyBindings[action] = newKey;

                    // Update Text
                    const displayText = newKey === 'RightClick' ? 'Sağ Tık' : newKey.toUpperCase();
                    btn.innerText = displayText;
                    btn.classList.remove('waiting');

                    // Remove Listeners
                    document.removeEventListener('keydown', handleBind);
                    document.removeEventListener('contextmenu', handleBind);
                };

                document.addEventListener('keydown', handleBind);
                document.addEventListener('contextmenu', handleBind);
            });
        });

        this.startBtn.addEventListener('click', () => {
            // Request Fullscreen (Mobile)
            const docEl = document.documentElement;
            const requestFull = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.msRequestFullscreen;
            const isMobileMode = (this.game.mobileControls && this.game.mobileControls.active);

            if (isMobileMode && requestFull) {
                requestFull.call(docEl).catch(err => {
                    console.warn("Fullscreen request failed:", err);
                });
            }

            this.game.start();
        });

        this.restartBtn.addEventListener('click', () => {
            this.game.start();
        });

        // Skill Elements
        this.smellCard = document.getElementById('skill-smell');
        this.whipCard = document.getElementById('skill-whip');
        this.smellCost = document.getElementById('cost-smell');
        this.whipCost = document.getElementById('cost-whip');
    }

    updateSelector() {
        const selected = this.characters[this.charIndex];
        this.game.setSelectedCharacter(selected);
        this.updateCharDisplay();
    }

    updateCharDisplay() {
        const name = this.characters[this.charIndex];
        this.charImage.src = getAsset(`assets/${name}.png`);
        this.charName.innerText = name.charAt(0).toUpperCase() + name.slice(1);
    }

    update() {
        this.healthBar.style.width = `${(this.game.player.health / this.game.player.maxHealth) * 100}%`;

        this.scoreEl.innerText = `Puan: ${this.game.score}`;
        this.waveEl.innerText = `Dalga: ${this.game.wave}`;
        this.timerEl.innerText = `Süre: ${Math.ceil(this.game.waveTimer)}`;

        // Update Skill UI
        const kills = this.game.player.killCount;

        // Smell (Cost 3)
        if (kills >= 3) {
            this.smellCard.classList.add('ready');
            this.smellCost.innerText = "HAZIR";
        } else {
            this.smellCard.classList.remove('ready');
            this.smellCost.innerText = `${kills}/3`;
        }

        // Whip (Cost 5)
        if (kills >= 5) {
            this.whipCard.classList.add('ready');
            this.whipCost.innerText = "HAZIR";
        } else {
            this.whipCard.classList.remove('ready');
            this.whipCost.innerText = `${kills}/5`;
        }
    }

    showStartScreen() {
        this.startScreen.classList.remove('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.hud.classList.add('hidden');
        document.body.classList.add('in-menu');
    }

    showGameOverScreen() {
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.remove('hidden');
        this.hud.classList.add('hidden');
        this.finalScoreEl.innerText = `Puan: ${this.game.score}`;
        this.finalWaveEl.innerText = `Dalga: ${this.game.wave}`;
        document.body.classList.add('in-menu');
    }

    showHUD() {
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.hud.classList.remove('hidden');
        document.body.classList.remove('in-menu');
    }

    showWaveAnnouncement(wave) {
        const el = document.getElementById('wave-announcement');
        el.innerText = `DALGA ${wave}`;
        el.classList.add('show');
        setTimeout(() => {
            el.classList.remove('show');
        }, 2000);
    }

    drawMinimap(ctx) {
        // Responsive Map Size
        const mapSize = this.game.width < 900 ? 100 : 150;
        const mapX = this.game.width - mapSize - 20;
        const mapY = 20;
        const scale = mapSize / Math.max(this.game.worldWidth, this.game.worldHeight);

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(mapX, mapY, mapSize, mapSize);
        ctx.strokeStyle = 'white';
        ctx.strokeRect(mapX, mapY, mapSize, mapSize);

        // Player
        ctx.fillStyle = 'lime';
        ctx.beginPath();
        ctx.arc(mapX + this.game.player.x * scale, mapY + this.game.player.y * scale, 3, 0, Math.PI * 2);
        ctx.fill();

        // Enemies
        ctx.fillStyle = 'red';
        this.game.enemies.forEach(enemy => {
            ctx.beginPath();
            ctx.arc(mapX + enemy.x * scale, mapY + enemy.y * scale, 2, 0, Math.PI * 2);
            ctx.fill();
        });

        // Obstacles
        ctx.fillStyle = 'gray';
        this.game.obstacles.forEach(obstacle => {
            ctx.fillRect(mapX + obstacle.x * scale, mapY + obstacle.y * scale, obstacle.width * scale, obstacle.height * scale);
        });
    }
}
