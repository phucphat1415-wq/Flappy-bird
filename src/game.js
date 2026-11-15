// Flappy Aero - Main Game Engine
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.bird = new Bird();
        this.obstacleManager = new ObstacleManager();
        this.particles = window.particleSystem;
        this.sound = window.soundEngine;
        this.levelMgr = window.levelManager;

        // Game States: 'MENU', 'PLAYING', 'PAUSED', 'CLEARED', 'GAMEOVER'
        this.state = 'MENU';
        this.currentLevelId = 1;
        this.currentLevel = this.levelMgr.getLevel(1);

        this.score = 0;
        this.starsCollected = 0;
        this.timeScale = 1.0;
        this.lastTime = performance.now();

        // Parallax background layers
        this.bgOffsetFar = 0;
        this.bgOffsetMid = 0;
        this.bgOffsetNear = 0;
        this.groundOffset = 0;

        // Global callbacks for game events
        window.onPipePassed = () => {
            this.addScore(10);
            if (this.sound) this.sound.playFlap(); // subtle chime or point tick
        };

        window.onScoreAdd = (pts) => {
            this.addScore(pts);
        };

        window.onStarCollected = () => {
            this.starsCollected++;
            this.updateHUD();
        };

        window.onLevelFinished = () => {
            this.handleLevelVictory();
        };

        this.initCanvasSize();
        this.bindEvents();
        this.updateHUD();

        // Start animation loop
        requestAnimationFrame((time) => this.loop(time));
    }

    initCanvasSize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.width = 440;
        this.height = 640;

        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.scale(dpr, dpr);
    }

    bindEvents() {
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            if (e.repeat) return;

            // Global fullscreen toggle (F11 or hotkey)
            if (e.code === 'KeyP' || e.code === 'Escape') {
                if (this.state === 'PLAYING') this.pauseGame();
                else if (this.state === 'PAUSED') this.resumeGame();
                return;
            }

            if (this.state === 'MENU' || this.state === 'GAMEOVER' || this.state === 'CLEARED') {
                if (e.code === 'Space' || e.code === 'Enter') {
                    if (this.state === 'CLEARED') this.startNextLevel();
                    else this.startLevel(this.currentLevelId);
                    return;
                }
            }

            if (this.state === 'PLAYING') {
                // Flap inputs: Space, ArrowUp, KeyW
                if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
                    e.preventDefault();
                    this.bird.flap();
                }

                // Skill 1: Dash (Shift, KeyJ, Digit1)
                if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyJ' || e.code === 'Digit1') {
                    if (this.levelMgr.isSkillAvailable('dash') || this.currentLevel.unlockedSkill === 'all' || this.currentLevelId >= 1) {
                        this.bird.activateDash();
                    }
                }

                // Skill 2: Shield (KeyE, KeyK, Digit2)
                if (e.code === 'KeyE' || e.code === 'KeyK' || e.code === 'Digit2') {
                    if (this.levelMgr.isSkillAvailable('shield') || this.currentLevel.unlockedSkill === 'all' || this.currentLevelId >= 2) {
                        this.bird.activateShield();
                    }
                }

                // Skill 3: Chrono (KeyQ, KeyL, Digit3)
                if (e.code === 'KeyQ' || e.code === 'KeyL' || e.code === 'Digit3') {
                    if (this.levelMgr.isSkillAvailable('chrono') || this.currentLevel.unlockedSkill === 'all' || this.currentLevelId >= 4) {
                        this.bird.activateChrono();
                    }
                }

                // Skill 4: Sonic Dart (KeyF, KeyI, Digit4)
                if (e.code === 'KeyF' || e.code === 'KeyI' || e.code === 'Digit4') {
                    if (this.levelMgr.isSkillAvailable('dart') || this.currentLevel.unlockedSkill === 'all' || this.currentLevelId >= 3) {
                        this.bird.activateSonicDart();
                    }
                }
            }
        });

        // Mouse & Touch controls on canvas
        this.canvas.addEventListener('pointerdown', (e) => {
            if (this.sound) this.sound.init();

            if (this.state === 'MENU') {
                this.startLevel(this.currentLevelId);
            } else if (this.state === 'PLAYING') {
                this.bird.flap();
            }
        });

        // Skill touch/mouse buttons in HUD
        document.getElementById('btnSkillDash')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.state === 'PLAYING') this.bird.activateDash();
        });
        document.getElementById('btnSkillShield')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.state === 'PLAYING') this.bird.activateShield();
        });
        document.getElementById('btnSkillChrono')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.state === 'PLAYING') this.bird.activateChrono();
        });
        document.getElementById('btnSkillDart')?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.state === 'PLAYING') this.bird.activateSonicDart();
        });

        // UI Modal buttons
        document.getElementById('btnStartCampaign')?.addEventListener('click', () => {
            this.startLevel(1);
        });
        document.getElementById('btnStartEndless')?.addEventListener('click', () => {
            this.startLevel('endless');
        });
        document.getElementById('btnOpenLevelSelect')?.addEventListener('click', () => {
            this.showLevelSelectModal();
        });
        document.getElementById('btnCloseLevelSelect')?.addEventListener('click', () => {
            this.hideLevelSelectModal();
        });
        document.getElementById('btnRestartGame')?.addEventListener('click', () => {
            this.startLevel(this.currentLevelId);
        });
        document.getElementById('btnNextLevel')?.addEventListener('click', () => {
            this.startNextLevel();
        });
        document.getElementById('btnReturnMenu')?.addEventListener('click', () => {
            this.showMenu();
        });
        document.getElementById('btnPauseToggle')?.addEventListener('click', () => {
            if (this.state === 'PLAYING') this.pauseGame();
            else if (this.state === 'PAUSED') this.resumeGame();
        });
        document.getElementById('btnResumeGame')?.addEventListener('click', () => {
            this.resumeGame();
        });
        document.getElementById('btnSoundToggle')?.addEventListener('click', () => {
            const enabled = this.sound.toggleSound();
            document.getElementById('btnSoundToggle').textContent = enabled ? '🔊' : '🔇';
        });
    }

    startLevel(levelId) {
        if (this.sound) {
            this.sound.init();
            this.sound.startMusic();
        }

        this.currentLevelId = levelId;
        this.currentLevel = this.levelMgr.getLevel(levelId);
        this.score = 0;
        this.starsCollected = 0;
        this.timeScale = 1.0;

        this.bird.reset(110, this.height * 0.45);
        this.obstacleManager.reset();
        this.particles.reset();

        this.state = 'PLAYING';
        this.hideAllOverlays();
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('levelIntroBanner').textContent = this.currentLevel.name;
        document.getElementById('levelIntroBanner').classList.remove('hidden');
        setTimeout(() => {
            document.getElementById('levelIntroBanner').classList.add('hidden');
        }, 2200);

        this.updateHUD();
    }

    startNextLevel() {
        if (typeof this.currentLevelId === 'number' && this.currentLevelId < 5) {
            this.startLevel(this.currentLevelId + 1);
        } else {
            this.startLevel('endless');
        }
    }

    pauseGame() {
        if (this.state !== 'PLAYING') return;
        this.state = 'PAUSED';
        document.getElementById('pauseOverlay').classList.remove('hidden');
    }

    resumeGame() {
        if (this.state !== 'PAUSED') return;
        this.state = 'PLAYING';
        this.lastTime = performance.now();
        document.getElementById('pauseOverlay').classList.add('hidden');
    }

    handleLevelVictory() {
        this.state = 'CLEARED';
        if (this.sound) this.sound.playVictory();

        // Calculate stars (1 star for finish, 2 stars for 2+ star coins, 3 stars for 4+ star coins)
        let stars = 1;
        if (this.starsCollected >= 2) stars = 2;
        if (this.starsCollected >= 4) stars = 3;

        this.levelMgr.completeLevel(this.currentLevelId, stars);
        this.levelMgr.updateHighScore(this.score);

        // Update Victory Modal
        document.getElementById('clearedTitle').textContent = `${this.currentLevel.name} CLEAR!`;
        document.getElementById('clearedScore').textContent = `Score: ${this.score}`;
        document.getElementById('clearedStars').textContent = '⭐'.repeat(stars);

        // Unlocked skill notice
        const nextSkillBox = document.getElementById('clearedSkillUnlock');
        if (this.currentLevel.unlockedSkill && this.currentLevel.unlockedSkill !== 'all' && this.currentLevel.unlockedSkill !== 'mastery') {
            nextSkillBox.innerHTML = `<span class="badge-new">NEW SKILL UNLOCKED!</span><br><strong>${this.currentLevel.skillTitle}</strong> (${this.currentLevel.skillKey})`;
            nextSkillBox.classList.remove('hidden');
        } else {
            nextSkillBox.classList.add('hidden');
        }

        document.getElementById('levelClearedOverlay').classList.remove('hidden');
        this.updateHUD();
    }

    handleGameOver() {
        this.state = 'GAMEOVER';
        this.levelMgr.updateHighScore(this.score);

        document.getElementById('gameOverScore').textContent = `Score: ${this.score}`;
        document.getElementById('gameOverBest').textContent = `High Score: ${this.levelMgr.highScore}`;
        document.getElementById('gameOverOverlay').classList.remove('hidden');
        this.updateHUD();
    }

    showMenu() {
        this.state = 'MENU';
        this.hideAllOverlays();
        document.getElementById('menuOverlay').classList.remove('hidden');
        document.getElementById('hud').classList.add('hidden');
        this.updateHUD();
    }

    hideAllOverlays() {
        document.getElementById('menuOverlay').classList.add('hidden');
        document.getElementById('levelSelectModal').classList.add('hidden');
        document.getElementById('pauseOverlay').classList.add('hidden');
        document.getElementById('levelClearedOverlay').classList.add('hidden');
        document.getElementById('gameOverOverlay').classList.add('hidden');
    }

    showLevelSelectModal() {
        const grid = document.getElementById('levelGrid');
        grid.innerHTML = '';

        this.levelMgr.levels.forEach(lvl => {
            const isUnlocked = lvl.id === 'endless' || lvl.id <= this.levelMgr.unlockedLevelMax;
            const stars = this.levelMgr.levelStars[lvl.id] || 0;

            const card = document.createElement('div');
            card.className = `level-card ${isUnlocked ? 'unlocked' : 'locked'}`;
            card.innerHTML = `
                <div class="level-card-header">
                    <h4>${lvl.name}</h4>
                    <span class="stars">${isUnlocked ? (stars > 0 ? '⭐'.repeat(stars) : '☆☆☆') : '🔒'}</span>
                </div>
                <p class="subtitle">${lvl.subtitle}</p>
                <div class="skill-tag">Skill: ${lvl.skillTitle}</div>
            `;

            if (isUnlocked) {
                card.onclick = () => {
                    this.hideLevelSelectModal();
                    this.startLevel(lvl.id);
                };
            }
            grid.appendChild(card);
        });

        document.getElementById('levelSelectModal').classList.remove('hidden');
    }

    hideLevelSelectModal() {
        document.getElementById('levelSelectModal').classList.add('hidden');
    }

    addScore(pts) {
        this.score += pts;
        this.updateHUD();
    }

    updateHUD() {
        const hudScore = document.getElementById('hudScore');
        if (hudScore) hudScore.textContent = this.score;
        const hudHigh = document.getElementById('hudHighScore');
        if (hudHigh) hudHigh.textContent = this.levelMgr.highScore;

        // Energy Bar
        const energyPct = Math.max(0, Math.min(100, (this.bird.energy / this.bird.maxEnergy) * 100));
        const energyBarFill = document.getElementById('energyBarFill');
        if (energyBarFill) {
            energyBarFill.style.width = `${energyPct}%`;
            document.getElementById('energyText').textContent = `${Math.floor(this.bird.energy)}%`;
        }

        // Level Distance Progress Bar
        const progBar = document.getElementById('distanceBarFill');
        if (progBar) {
            if (this.currentLevel.targetDistance) {
                const distPct = Math.min(100, (this.obstacleManager.distanceTravelled / this.currentLevel.targetDistance) * 100);
                progBar.style.width = `${distPct}%`;
                document.getElementById('distanceText').textContent = `${Math.floor(this.obstacleManager.distanceTravelled)}m / ${this.currentLevel.targetDistance}m`;
            } else {
                progBar.style.width = `100%`;
                document.getElementById('distanceText').textContent = `${Math.floor(this.obstacleManager.distanceTravelled)}m (Endless)`;
            }
        }

        // Skill Button States
        this.updateSkillButton('btnSkillDash', 'dash', 30, this.currentLevelId >= 1 || this.levelMgr.isSkillAvailable('dash'));
        this.updateSkillButton('btnSkillShield', 'shield', 40, this.currentLevelId >= 2 || this.levelMgr.isSkillAvailable('shield'));
        this.updateSkillButton('btnSkillChrono', 'chrono', 35, this.currentLevelId >= 4 || this.levelMgr.isSkillAvailable('chrono'));
        this.updateSkillButton('btnSkillDart', 'dart', 25, this.currentLevelId >= 3 || this.levelMgr.isSkillAvailable('dart'));
    }

    updateSkillButton(btnId, skillKey, cost, isUnlocked) {
        const btn = document.getElementById(btnId);
        if (!btn) return;

        if (!isUnlocked && this.currentLevel.id !== 'endless') {
            btn.classList.add('locked');
            btn.classList.remove('ready', 'not-enough-energy', 'active');
        } else {
            btn.classList.remove('locked');
            let isActive = false;
            if (skillKey === 'dash' && this.bird.isDashing) isActive = true;
            if (skillKey === 'shield' && (this.bird.hasShield || this.bird.isShieldBreaking)) isActive = true;
            if (skillKey === 'chrono' && this.bird.isChronoActive) isActive = true;

            if (isActive) {
                btn.classList.add('active');
                btn.classList.remove('ready', 'not-enough-energy');
            } else if (this.bird.energy >= cost) {
                btn.classList.add('ready');
                btn.classList.remove('not-enough-energy', 'active');
            } else {
                btn.classList.add('not-enough-energy');
                btn.classList.remove('ready', 'active');
            }
        }
    }

    loop(currentTime) {
        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;

        // Apply Chrono Shift slow motion
        this.timeScale = this.bird.isChronoActive ? 0.42 : 1.0;

        if (this.state === 'PLAYING') {
            this.update(dt);
        }

        this.render();

        requestAnimationFrame((time) => this.loop(time));
    }

    update(dt) {
        const effectiveDt = dt * this.timeScale;

        // Parallax background scrolling
        const scrollSpeed = this.currentLevel.speed * this.timeScale;
        this.bgOffsetFar = (this.bgOffsetFar + scrollSpeed * 0.15 * dt) % this.width;
        this.bgOffsetMid = (this.bgOffsetMid + scrollSpeed * 0.4 * dt) % this.width;
        this.bgOffsetNear = (this.bgOffsetNear + scrollSpeed * 0.75 * dt) % this.width;
        this.groundOffset = (this.groundOffset + scrollSpeed * dt) % 24;

        // Update Bird
        this.bird.update(dt, this.height);

        // Update Obstacles & Collectibles
        this.obstacleManager.update(dt, this.bird, this.currentLevel, this.width, this.height, this.timeScale);

        // Collision Check
        if (this.obstacleManager.checkCollision(this.bird, this.height)) {
            this.handleGameOver();
        }

        // Update Particle System
        this.particles.update(dt, this.timeScale);

        // Periodically refresh HUD values
        this.updateHUD();
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 1. Draw Themed Background
        this.renderBackground();

        // 2. Draw Obstacles & Collectibles
        this.obstacleManager.draw(this.ctx, this.height);

        // 3. Draw Ground Line
        this.renderGround();

        // 4. Draw Bird (Thin & short silhouette with wings & glow)
        this.bird.draw(this.ctx);

        // 5. Draw Particle effects & Floating Combat Text
        this.particles.draw(this.ctx);

        // 6. Chrono Slow-Mo Screen Filter
        if (this.bird.isChronoActive) {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(250, 204, 21, 0.08)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.restore();
        }
    }

    renderBackground() {
        const ctx = this.ctx;
        const gradColors = this.currentLevel.bgGradient || ['#0f172a', '#1e293b', '#334155'];

        // Sky Gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
        gradColors.forEach((col, idx) => {
            skyGrad.addColorStop(idx / (gradColors.length - 1), col);
        });
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, this.width, this.height);

        // Parallax Distant Layer (Clouds / Mountain peaks)
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
        for (let i = -1; i < 3; i++) {
            const bx = i * 260 - (this.bgOffsetFar % 260);
            ctx.beginPath();
            ctx.arc(bx + 80, this.height * 0.35, 70, 0, Math.PI * 2);
            ctx.arc(bx + 140, this.height * 0.32, 90, 0, Math.PI * 2);
            ctx.arc(bx + 200, this.height * 0.36, 65, 0, Math.PI * 2);
            ctx.fill();
        }

        // Parallax Midground Layer (Silhouetted hills / structures)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        for (let i = -1; i < 4; i++) {
            const mx = i * 180 - (this.bgOffsetMid % 180);
            ctx.beginPath();
            ctx.moveTo(mx, this.height);
            ctx.lineTo(mx + 90, this.height * 0.65);
            ctx.lineTo(mx + 180, this.height);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }

    renderGround() {
        const ctx = this.ctx;
        const groundHeight = 22;
        const groundY = this.height - groundHeight;

        // Ground base
        ctx.fillStyle = this.currentLevel.groundColor || '#0f172a';
        ctx.fillRect(0, groundY, this.width, groundHeight);

        // Top decorative boundary line
        ctx.strokeStyle = this.currentLevel.pipeAccent || '#38bdf8';
        ctx.lineWidth = 3;
        ctx.shadowColor = this.currentLevel.pipeAccent || '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(this.width, groundY);
        ctx.stroke();

        // Ground hazard stripes scrolling
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 2;
        for (let x = -24; x < this.width + 24; x += 24) {
            const gx = x - this.groundOffset;
            ctx.beginPath();
            ctx.moveTo(gx, groundY);
            ctx.lineTo(gx - 10, this.height);
            ctx.stroke();
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
