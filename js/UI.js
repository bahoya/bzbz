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
                    } else if (e.type === 'mousedown') {
                        if (e.button === 0) newKey = 'LeftClick';
                        else if (e.button === 2) newKey = 'RightClick';
                        else newKey = `Mouse${e.button}`;
                    } else {
                        newKey = e.key.toLowerCase();
                    }

                    if (!newKey) return; // Ignore if undefined

                    // Validation: Uniqueness
                    for (const [act, key] of Object.entries(this.game.keyBindings)) {
                        if (key === newKey && act !== action) {
                            alert(`Bu tuş zaten ${act.toUpperCase()} için kullanılıyor!`);
                            btn.innerText = this.game.keyBindings[action].toUpperCase();
                            btn.classList.remove('waiting');
                            document.removeEventListener('keydown', handleBind);
                            document.removeEventListener('contextmenu', handleBind);
                            document.removeEventListener('mousedown', handleBind);
                            return;
                        }
                    }

                    // Update Binding
                    this.game.keyBindings[action] = newKey;

                    // Update Text
                    let displayText = newKey.toUpperCase();
                    if (newKey === 'RightClick') displayText = 'Sağ Tık';
                    if (newKey === 'LeftClick') displayText = 'Sol Tık';

                    btn.innerText = displayText;
                    btn.classList.remove('waiting');

                    // Remove Listeners
                    document.removeEventListener('keydown', handleBind);
                    document.removeEventListener('contextmenu', handleBind);
                    document.removeEventListener('mousedown', handleBind);
                };

                document.addEventListener('keydown', handleBind);
                document.addEventListener('contextmenu', handleBind);
                document.addEventListener('mousedown', handleBind);
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

        // Leaderboard Elements (Game Over)
        this.nameInput = document.getElementById('player-name-input');
        this.submitBtn = document.getElementById('submit-score-btn');
        this.leaderboardContainer = document.getElementById('leaderboard-table-container');
        this.submitStatus = document.getElementById('submit-status');

        // Main Menu Leaderboard
        this.mainLeaderboardBtn = document.getElementById('main-leaderboard-btn');
        this.leaderboardModal = document.getElementById('leaderboard-modal');
        this.modalLeaderboardContainer = document.getElementById('modal-leaderboard-container');
        this.closeLeaderboardBtn = document.getElementById('close-leaderboard-btn');

        if (this.submitBtn) {
            this.submitBtn.addEventListener('click', () => this.submitScore());
        }

        if (this.mainLeaderboardBtn) {
            this.mainLeaderboardBtn.addEventListener('click', () => {
                this.leaderboardModal.classList.remove('hidden');
                this.loadLeaderboard(this.modalLeaderboardContainer);
            });
        }

        if (this.closeLeaderboardBtn) {
            this.closeLeaderboardBtn.addEventListener('click', () => {
                this.leaderboardModal.classList.add('hidden');
            });
        }
    }

    async submitScore() {
        const name = this.nameInput.value.trim();
        if (!name) {
            alert("Lütfen bir isim girin!");
            return;
        }

        if (!window.Leaderboard) {
            alert("Leaderboard servisi yüklenemedi!");
            return;
        }

        this.submitBtn.disabled = true;
        this.submitBtn.innerText = "KAYDEDİLİYOR...";

        const success = await window.Leaderboard.submitScore(
            name,
            this.game.score,
            this.game.wave,
            this.game.selectedCharacter || 'omer'
        );

        if (success) {
            this.submitStatus.innerText = "Skor Kaydedildi! ✅";
            this.submitStatus.classList.remove('hidden');
            this.submitStatus.style.color = '#2ecc71';
            this.nameInput.classList.add('hidden');
            this.submitBtn.classList.add('hidden');

            // Reload table
            this.loadLeaderboard(this.leaderboardContainer);
        } else {
            this.submitBtn.innerText = "TEKRAR DENE";
            this.submitBtn.disabled = false;
            alert("Hata oluştu. İnternet bağlantını kontrol et.");
        }
    }

    async loadLeaderboard(container) {
        if (!container) return; // Guard

        if (!window.Leaderboard) {
            container.innerHTML = "<p>Bağlantı hatası.</p>";
            return;
        }

        container.innerHTML = "<p>Yükleniyor...</p>";
        const scores = await window.Leaderboard.getTopScores(10);

        if (scores.length === 0) {
            container.innerHTML = "<p>Henüz skor yok.</p>";
            return;
        }

        let html = `
        <table class="leaderboard-table">
            <tr>
                <th>#</th>
                <th>İsim</th>
                <th>Karakter</th>
                <th>Dalga</th>
                <th>Puan</th>
            </tr>`;

        scores.forEach((s, index) => {
            // Char Image Logic
            const charName = s.character || 'omer';
            // Assuming getAsset is globally available or we use path directly
            // Since getAsset is in Utils, and Utils is loaded before UI...
            // But getAsset logic might be complex with bundles.
            // Let's use getAsset if defined, else fallback.
            let charSrc = `assets/${charName}.png`;
            if (typeof getAsset === 'function') {
                charSrc = getAsset(`assets/${charName}.png`);
            }

            const charImg = `<img src="${charSrc}" class="score-char-img" alt="${charName}">`;

            html += `
            <tr>
                <td class="score-rank">${index + 1}</td>
                <td class="score-name">${s.name}</td>
                <td class="score-char">${charImg}</td>
                <td>${s.wave}</td>
                <td class="score-val">${s.score}</td>
            </tr>`;
        });

        html += "</table>";
        container.innerHTML = html;
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

        // Reset and Load Leaderboard
        this.nameInput.value = "";
        this.nameInput.classList.remove('hidden');
        this.submitBtn.classList.remove('hidden');
        this.submitBtn.disabled = false;
        this.submitBtn.innerText = "SKORU KAYDET";
        this.submitStatus.classList.add('hidden');

        this.loadLeaderboard(this.leaderboardContainer);
    }

    showHUD() {
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.hud.classList.remove('hidden');
        document.body.classList.remove('in-menu');
        this.updateSkillIcons(); // Update icons based on character
    }

    updateSkillIcons() {
        const type = this.game.player.type;
        const smellName = this.smellCard.querySelector('.skill-name');
        const smellIcon = this.smellCard.querySelector('.skill-icon');
        const whipName = this.whipCard.querySelector('.skill-name');
        const whipIcon = this.whipCard.querySelector('.skill-icon');

        if (type === 'thr') {
            smellName.innerText = "HIZ (E)";
            smellIcon.innerText = "⚡";
            whipName.innerText = "KLON (R)";
            whipIcon.innerText = "👥";
        } else if (type === 'alik') {
            smellName.innerText = "OSURUK (E)";
            smellIcon.innerText = "💨";
            whipName.innerText = "AMBULANS (R)";
            whipIcon.innerText = "🚑";
        } else if (type === 'efe') {
            smellName.innerText = "TUZAK (E)";
            smellIcon.innerText = "🥗";
            whipName.innerText = "OFOEDU (R)";
            whipIcon.innerText = "🗿";
        } else if (type === 'baho') {
            smellName.innerText = "KIZILAY (E)";
            smellIcon.innerText = "🌙";
            whipName.innerText = "TANK TİMİ (R)";
            whipIcon.innerText = "🚜";
        } else if (type === 'ali') {
            smellName.innerText = "SPAGETTI (E)";
            smellIcon.innerText = "🍝";
            whipName.innerText = "HAYALET (R)";
            whipIcon.innerText = "👻";
        } else if (type === 'dgkn') {
            smellName.innerText = "SİGARA (E)";
            smellIcon.innerText = "🚬";
            whipName.innerText = "TIRAŞ (R)";
            whipIcon.innerText = "🪒";
        } else {
            // Default Omer
            smellName.innerText = "KOKU (E)";
            smellIcon.innerText = "🦶";
            whipName.innerText = "KEMER (R)";
            whipIcon.innerText = "➰";
        }
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
