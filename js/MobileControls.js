class MobileControls {
    constructor(game) {
        this.game = game;
        this.active = false;

        // Main Movement Joystick
        this.moveJoy = {
            base: null, stick: null,
            data: { x: 0, y: 0, active: false },
            touchId: null, baseX: 0, baseY: 0, maxRadius: 50
        };

        // Skill Joysticks (Buttons act as joysticks)
        // configured below
        this.skills = {
            q: {
                id: 'btn-q', label: 'Q',
                base: null, stick: null, indicator: null,
                active: false, touchId: null,
                data: { x: 0, y: 0 },
                action: 'axe'
            },
            e: {
                id: 'btn-e', label: 'E',
                base: null, stick: null, indicator: null, // E is instant, but keeping structure if needed? No, E is instant.
                active: false, touchId: null,
                action: 'smoke',
                isInstant: true
            },
            r: {
                id: 'btn-r', label: 'R',
                base: null, stick: null, indicator: null,
                active: false, touchId: null,
                data: { x: 0, y: 0 },
                action: 'whip'
            }
        };

        this.init();
    }

    init() {
        // Auto-detect mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        this.createDOM();
        this.setupEvents();

        if (isMobile) {
            // Activate directly
            const checkbox = document.getElementById('mobile-toggle');
            if (checkbox) {
                checkbox.checked = true;
                // Trigger change event manually or set active
                checkbox.dispatchEvent(new Event('change'));
            }
        }
    }

    createDOM() {
        this.container = document.createElement('div');
        this.container.id = 'mobile-controls';
        this.container.className = 'hidden';
        document.body.appendChild(this.container);

        // --- Movement Joystick ---
        this.moveJoy.base = document.createElement('div');
        this.moveJoy.base.id = 'joystick-base';
        this.moveJoy.stick = document.createElement('div');
        this.moveJoy.stick.id = 'joystick-stick';
        this.moveJoy.base.appendChild(this.moveJoy.stick);
        this.container.appendChild(this.moveJoy.base);

        // --- Buttons / Skill Joysticks ---
        this.buttonsContainer = document.createElement('div');
        this.buttonsContainer.id = 'mobile-buttons';
        this.container.appendChild(this.buttonsContainer);

        // Define Create Helper
        const createSkillControl = (skillKey) => {
            const skill = this.skills[skillKey];

            const btnBase = document.createElement('div');
            btnBase.id = skill.id;
            btnBase.className = 'mobile-btn glass';

            // Icon/Text
            const label = document.createElement('span');
            label.innerText = skill.label;
            label.style.pointerEvents = 'none';
            btnBase.appendChild(label);

            if (!skill.isInstant) {
                // Joystick Stick for Aiming (Hidden by default or centered)
                skill.stick = document.createElement('div');
                skill.stick.className = 'skill-stick hidden';
                btnBase.appendChild(skill.stick);

                // Aim Indicator (Arrow)
                skill.indicator = document.createElement('div');
                skill.indicator.className = 'aim-indicator hidden';
                // We'll append indicator to game world or container? 
                // Better to simple rotate a div inside the button or around player?
                // Visualizing aim from player is best.
                // Let's create a global aim indicator arrow in the game container, or just use angle.
                // Actually, simple "stick" inside the button is good for input feedback.
                // But user wants "Arrow". Let's show an arrow on top of the button for now.
                btnBase.appendChild(skill.indicator);
            }

            this.buttonsContainer.appendChild(btnBase);
            skill.base = btnBase;
        };

        createSkillControl('q');
        createSkillControl('e');
        createSkillControl('r');

        // Toggle Switch
        const toggleContainer = document.createElement('div');
        toggleContainer.id = 'mobile-toggle-container';
        toggleContainer.innerHTML = `
            <label class="switch">
                <input type="checkbox" id="mobile-toggle">
                <span class="slider round"></span>
            </label>
            <span id="mobile-mode-label" style="margin-left: 10px; color: white; font-weight: bold;">Masaüstü Mod</span>
        `;

        const startScreen = document.getElementById('start-screen');
        if (startScreen) {
            const btn = document.getElementById('start-btn');
            startScreen.insertBefore(toggleContainer, btn);
        }

        const checkbox = document.getElementById('mobile-toggle');
        const labelEl = document.getElementById('mobile-mode-label');
        if (checkbox) {
            checkbox.addEventListener('change', (e) => {
                this.active = e.target.checked;
                labelEl.innerText = this.active ? "Mobil Mod" : "Masaüstü Mod";
            });
        }
    }

    setupEvents() {
        // --- Movement Joystick Logic ---
        const handleMoveStart = (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            this.moveJoy.touchId = touch.identifier;
            this.moveJoy.data.active = true;
            const rect = this.moveJoy.base.getBoundingClientRect();
            this.moveJoy.baseX = rect.left + rect.width / 2;
            this.moveJoy.baseY = rect.top + rect.height / 2;
            this.updateMoveJoy(touch.clientX, touch.clientY);
        };

        const handleMoveDrag = (e) => {
            e.preventDefault();
            if (!this.moveJoy.data.active) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.moveJoy.touchId) {
                    this.updateMoveJoy(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
                    break;
                }
            }
        };

        const handleMoveEnd = (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.moveJoy.touchId) {
                    this.moveJoy.data.active = false;
                    this.moveJoy.data.x = 0;
                    this.moveJoy.data.y = 0;
                    this.moveJoy.stick.style.transform = `translate(0px, 0px)`;
                    this.moveJoy.touchId = null;
                    break;
                }
            }
        };

        this.moveJoy.base.addEventListener('touchstart', handleMoveStart, { passive: false });
        this.moveJoy.base.addEventListener('touchmove', handleMoveDrag, { passive: false });
        this.moveJoy.base.addEventListener('touchend', handleMoveEnd, { passive: false });
        this.moveJoy.base.addEventListener('touchcancel', handleMoveEnd, { passive: false });


        // --- Skill Buttons Logic ---
        const setupSkillEvents = (key) => {
            const skill = this.skills[key];
            if (skill.isInstant) {
                // Tap only
                skill.base.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    skill.base.classList.add('active');
                    this.triggerSkill(key);
                }, { passive: false });
                skill.base.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    skill.base.classList.remove('active');
                }, { passive: false });
                return;
            }

            // Drag to Aim
            skill.base.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const touch = e.changedTouches[0];
                skill.touchId = touch.identifier;
                skill.active = true;
                skill.base.classList.add('active'); // Visual feedback

                // Track for tap detection
                skill.startTime = Date.now();
                skill.startX = touch.clientX;
                skill.startY = touch.clientY;

                // Show joystick/indicator
                skill.stick.classList.remove('hidden');
                skill.indicator.classList.remove('hidden');

                const rect = skill.base.getBoundingClientRect();
                skill.baseX = rect.left + rect.width / 2;
                skill.baseY = rect.top + rect.height / 2;

                // Initial Update
                this.updateSkillJoy(key, touch.clientX, touch.clientY);
            }, { passive: false });

            skill.base.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (!skill.active) return;
                for (let i = 0; i < e.changedTouches.length; i++) {
                    if (e.changedTouches[i].identifier === skill.touchId) {
                        this.updateSkillJoy(key, e.changedTouches[i].clientX, e.changedTouches[i].clientY);
                        break;
                    }
                }
            }, { passive: false });

            const endSkill = (e) => {
                e.preventDefault();
                for (let i = 0; i < e.changedTouches.length; i++) {
                    if (e.changedTouches[i].identifier === skill.touchId) {

                        if (key === 'q') {
                            // Fire 5 axes in the drag direction
                            if (Math.abs(skill.data.x) > 0.05 || Math.abs(skill.data.y) > 0.05) {
                                const angle = Math.atan2(skill.data.y, skill.data.x);
                                // Fire 5 axes rapidly
                                this.fireBurstAxes(angle, 5);
                            }

                            // Reset Q visuals
                            skill.active = false;
                            skill.base.classList.remove('active');
                            skill.touchId = null;
                            skill.stick.classList.add('hidden');
                            skill.indicator.classList.add('hidden');
                            skill.data.x = 0;
                            skill.data.y = 0;
                        } else {
                            // Standard behavior for R
                            if (Math.abs(skill.data.x) > 0.1 || Math.abs(skill.data.y) > 0.1) {
                                this.triggerSkill(key, skill.data.x, skill.data.y);
                            } else if (key !== 'e') {
                                this.triggerSkill(key, 0, 0);
                            }

                            // Reset
                            skill.active = false;
                            skill.base.classList.remove('active');
                            skill.stick.classList.add('hidden');
                            skill.indicator.classList.add('hidden');
                            skill.stick.style.transform = `translate(0px, 0px)`;
                            skill.data.x = 0;
                            skill.data.y = 0;
                            skill.touchId = null;
                        }
                        break;
                    }
                }
            };

            skill.base.addEventListener('touchend', endSkill, { passive: false });
            skill.base.addEventListener('touchcancel', endSkill, { passive: false });
        };

        setupSkillEvents('q');
        setupSkillEvents('e');
        setupSkillEvents('r');
    }

    updateMoveJoy(x, y) {
        let dx = x - this.moveJoy.baseX;
        let dy = y - this.moveJoy.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const max = this.moveJoy.maxRadius;

        if (dist > max) {
            const ratio = max / dist;
            dx *= ratio;
            dy *= ratio;
        }

        this.moveJoy.data.x = dx / max;
        this.moveJoy.data.y = dy / max;
        this.moveJoy.stick.style.transform = `translate(${dx}px, ${dy}px)`;
    }

    updateSkillJoy(key, x, y) {
        const skill = this.skills[key];
        let dx = x - skill.baseX;
        let dy = y - skill.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const max = 35; // Smaller radius for buttons

        if (dist > max) {
            const ratio = max / dist;
            dx *= ratio;
            dy *= ratio;
        }

        // Normalize for data
        skill.data.x = dx / (max || 1);
        skill.data.y = dy / (max || 1);

        skill.stick.style.transform = `translate(${dx}px, ${dy}px)`;

        // Rotate indicator
        // For Q, only update rotation if we are "aiming" (dist > some threshold) 
        // to prevent snapping when just tapping center to fire.
        if (key === 'q' && dist < 10) {
            // Don't update rotation visual
            return;
        }

        const angle = Math.atan2(dy, dx);
        skill.indicator.style.transform = `translate(-50%, -50%) rotate(${angle}rad) translateX(30px)`; // Push visual out
        skill.lastAimAngle = angle; // Live update
    }

    triggerSkill(key, dirX, dirY) {
        if (!this.game || this.game.gameState !== 'PLAYING') return;

        if (key === 'q') {
            // Axe
            // If dirX/Y is 0 (tap), use Persistent Aim or default
            let targetX, targetY;
            const skill = this.skills[key];

            if (dirX === 0 && dirY === 0) {
                // Tap
                if (skill.lastAimAngle !== undefined) {
                    // Use Persistent Aim
                    targetX = this.game.player.x + this.game.player.width / 2 + Math.cos(skill.lastAimAngle) * 500;
                    targetY = this.game.player.y + this.game.player.height / 2 + Math.sin(skill.lastAimAngle) * 500;
                } else {
                    // Default right
                    targetX = this.game.player.x + 500;
                    targetY = this.game.player.y;
                }
            } else {
                targetX = this.game.player.x + dirX * 300;
                targetY = this.game.player.y + dirY * 300;
            }

            this.game.throwAxe(targetX, targetY);

        } else if (key === 'e') {
            // Smoke (Instant)
            if (this.game.player.useSkill(3)) {
                this.game.player.activateFootSmell();
                this.game.soundManager.play('duman');
            }

        } else if (key === 'r') {
            // Whip
            if (this.game.player.useSkill(5) && !this.game.whip.active) {
                let targetX, targetY;
                if (dirX === 0 && dirY === 0) {
                    if (this.moveJoy.data.active) {
                        targetX = this.game.player.x + this.moveJoy.data.x * 200;
                        targetY = this.game.player.y + this.moveJoy.data.y * 200;
                    } else {
                        targetX = this.game.player.x + 200;
                        targetY = this.game.player.y;
                    }
                } else {
                    targetX = this.game.player.x + dirX * 300;
                    targetY = this.game.player.y + dirY * 300;
                }
                this.game.whip.activate(targetX, targetY);
            }
        }
    }

    // Proxy for Player update to read joystick
    get joystickData() {
        return this.moveJoy.data;
    }

    show() {
        if (this.active) {
            this.container.classList.remove('hidden');
        }
    }

    hide() {
        this.container.classList.add('hidden');
    }

    async fireBurstAxes(angle, count) {
        // Fire multiple axes rapidly in the given direction
        const delay = 80; // ms between shots
        for (let i = 0; i < count; i++) {
            const startX = this.game.player.x + this.game.player.width / 2;
            const startY = this.game.player.y + this.game.player.height / 2;
            const targetX = startX + Math.cos(angle) * 1000;
            const targetY = startY + Math.sin(angle) * 1000;
            this.game.throwAxe(targetX, targetY);
            if (i < count - 1) {
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }
}
