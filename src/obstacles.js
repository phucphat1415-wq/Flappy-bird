// Flappy Aero - Obstacles, Hazards, Collectibles, and Finish Gate
class ObstacleManager {
    constructor() {
        this.reset();
    }

    reset() {
        this.pipes = [];
        this.collectibles = [];
        this.finishGate = null;
        this.distanceTravelled = 0;
        this.spawnTimer = 0;
    }

    // Spawn a pipe pair or specialized hazard based on current level settings
    spawnPipe(canvasWidth, canvasHeight, levelConfig) {
        const gapSize = levelConfig.gapSize || 130;
        const pipeWidth = levelConfig.pipeWidth || 56;
        const minTop = 60;
        const maxTop = canvasHeight - gapSize - 100;
        const topHeight = minTop + Math.random() * (maxTop - minTop);
        const bottomY = topHeight + gapSize;
        const bottomHeight = canvasHeight - bottomY;

        // Is this pipe oscillating?
        const isOscillating = levelConfig.movingPipes && Math.random() < levelConfig.oscillateChance;
        const oscillationAmp = isOscillating ? (15 + Math.random() * 25) : 0;
        const oscillationFreq = isOscillating ? (1.5 + Math.random() * 1.5) : 0;

        // Does this pipe have a breakable crystal barrier?
        const hasBreakable = levelConfig.breakablePipes && Math.random() < levelConfig.breakableChance;

        const pipe = {
            x: canvasWidth + 20,
            width: pipeWidth,
            topHeight: topHeight,
            baseTopHeight: topHeight,
            bottomY: bottomY,
            bottomHeight: bottomHeight,
            gapSize: gapSize,
            color: levelConfig.pipeColor || '#10b981',
            accentColor: levelConfig.pipeAccent || '#34d399',
            passed: false,
            isOscillating: isOscillating,
            oscillationAmp: oscillationAmp,
            oscillationFreq: oscillationFreq,
            oscillationTimer: Math.random() * Math.PI * 2,
            hasBreakable: hasBreakable,
            breakableDestroyed: false,
            breakableY: topHeight + gapSize * 0.35,
            breakableHeight: gapSize * 0.3
        };

        this.pipes.push(pipe);

        // Spawn collectibles inside the gap
        if (Math.random() < 0.85) {
            const isStar = Math.random() < 0.35;
            this.collectibles.push({
                x: pipe.x + pipeWidth / 2,
                y: topHeight + gapSize / 2 + (Math.random() * 30 - 15),
                type: isStar ? 'star' : 'energy',
                radius: isStar ? 9 : 7,
                collected: false,
                floatOffset: Math.random() * Math.PI * 2,
                parentPipe: pipe
            });
        }
    }

    spawnFinishGate(canvasWidth, canvasHeight, levelConfig) {
        this.finishGate = {
            x: canvasWidth + 40,
            y: canvasHeight / 2,
            radius: 50,
            passed: false,
            color: levelConfig.portalColor || '#38bdf8'
        };
    }

    update(dt, bird, levelConfig, canvasWidth, canvasHeight, timeScale = 1.0) {
        const effectiveDt = dt * timeScale;
        const scrollSpeed = levelConfig.speed * timeScale;

        this.distanceTravelled += scrollSpeed * dt;

        // Spawn timer
        if (!this.finishGate) {
            this.spawnTimer += effectiveDt;
            if (this.spawnTimer >= levelConfig.spawnInterval) {
                this.spawnTimer = 0;
                // Check if target distance is reached
                if (levelConfig.targetDistance && this.distanceTravelled >= levelConfig.targetDistance) {
                    this.spawnFinishGate(canvasWidth, canvasHeight, levelConfig);
                } else {
                    this.spawnPipe(canvasWidth, canvasHeight, levelConfig);
                }
            }
        }

        // Update Pipes
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const p = this.pipes[i];
            p.x -= scrollSpeed * dt;

            // Handle oscillating movement
            if (p.isOscillating) {
                p.oscillationTimer += effectiveDt * p.oscillationFreq;
                const offset = Math.sin(p.oscillationTimer) * p.oscillationAmp;
                p.topHeight = p.baseTopHeight + offset;
                p.bottomY = p.topHeight + p.gapSize;
                p.bottomHeight = canvasHeight - p.bottomY;
                if (p.hasBreakable) {
                    p.breakableY = p.topHeight + p.gapSize * 0.35;
                }
            }

            // Score passing check
            if (!p.passed && p.x + p.width < bird.x) {
                p.passed = true;
                if (window.onPipePassed) window.onPipePassed();
            }

            // Check Sonic Dart projectiles hitting breakable barriers
            if (p.hasBreakable && !p.breakableDestroyed) {
                for (let j = bird.projectiles.length - 1; j >= 0; j--) {
                    const proj = bird.projectiles[j];
                    if (
                        proj.x >= p.x &&
                        proj.x <= p.x + p.width &&
                        proj.y >= p.breakableY &&
                        proj.y <= p.breakableY + p.breakableHeight
                    ) {
                        p.breakableDestroyed = true;
                        bird.projectiles.splice(j, 1);
                        if (window.soundEngine) window.soundEngine.playExplosion();
                        if (window.particleSystem) {
                            window.particleSystem.addExplosion(p.x + p.width / 2, p.breakableY + p.breakableHeight / 2, '#ef4444');
                            window.particleSystem.addFloatingText('BLASTED! +75', p.x, p.breakableY, '#ef4444');
                        }
                        if (window.onScoreAdd) window.onScoreAdd(75);
                        break;
                    }
                }
            }

            // Remove off-screen pipes
            if (p.x + p.width < -40) {
                this.pipes.splice(i, 1);
            }
        }

        // Update Collectibles
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const c = this.collectibles[i];
            c.x -= scrollSpeed * dt;
            c.floatOffset += effectiveDt * 4;

            // Follow oscillating pipe if bound
            if (c.parentPipe && c.parentPipe.isOscillating) {
                c.y = c.parentPipe.topHeight + c.parentPipe.gapSize / 2 + Math.sin(c.floatOffset) * 4;
            }

            // Collision with Bird (Thin & short bird check)
            const dist = Math.hypot(c.x - bird.x, c.y - bird.y);
            if (!c.collected && dist < bird.hitboxRadiusX + c.radius + 6) {
                c.collected = true;
                if (window.soundEngine) window.soundEngine.playSparkPickup();

                if (c.type === 'energy') {
                    bird.energy = Math.min(bird.maxEnergy, bird.energy + 25);
                    if (window.particleSystem) {
                        window.particleSystem.addSparkle(c.x, c.y, '#38bdf8');
                        window.particleSystem.addFloatingText('+25 ENERGY', c.x, c.y - 12, '#38bdf8');
                    }
                    if (window.onScoreAdd) window.onScoreAdd(40);
                } else {
                    // Star coin
                    if (window.particleSystem) {
                        window.particleSystem.addSparkle(c.x, c.y, '#facc15');
                        window.particleSystem.addFloatingText('+100 STAR!', c.x, c.y - 12, '#facc15');
                    }
                    if (window.onStarCollected) window.onStarCollected();
                    if (window.onScoreAdd) window.onScoreAdd(100);
                }
                this.collectibles.splice(i, 1);
                continue;
            }

            if (c.x < -30) {
                this.collectibles.splice(i, 1);
            }
        }

        // Update Finish Gate
        if (this.finishGate) {
            this.finishGate.x -= scrollSpeed * dt;
            const distToGate = Math.hypot(this.finishGate.x - bird.x, this.finishGate.y - bird.y);
            if (!this.finishGate.passed && distToGate < this.finishGate.radius + bird.hitboxRadiusX) {
                this.finishGate.passed = true;
                if (window.onLevelFinished) window.onLevelFinished();
            }
        }
    }

    // Check collisions with thin & short bird
    checkCollision(bird, canvasHeight) {
        if (!bird.isAlive) return false;

        // Ground collision (canvas bottom boundary)
        if (bird.y + bird.hitboxRadiusY >= canvasHeight - 20) {
            bird.handleCollision();
            return true;
        }

        // Pipe collisions
        const bx = bird.x;
        const by = bird.y;
        const rx = bird.hitboxRadiusX;
        const ry = bird.hitboxRadiusY;

        for (const p of this.pipes) {
            // Check if bird is horizontally aligned with pipe
            if (bx + rx > p.x && bx - rx < p.x + p.width) {
                // Top pipe collision
                if (by - ry < p.topHeight) {
                    if (bird.handleCollision()) return true;
                }
                // Bottom pipe collision
                if (by + ry > p.bottomY) {
                    if (bird.handleCollision()) return true;
                }
                // Breakable barrier collision
                if (p.hasBreakable && !p.breakableDestroyed) {
                    if (by + ry > p.breakableY && by - ry < p.breakableY + p.breakableHeight) {
                        // If dashing, the bird can smash through breakable barrier!
                        if (bird.isDashing) {
                            p.breakableDestroyed = true;
                            if (window.soundEngine) window.soundEngine.playExplosion();
                            if (window.particleSystem) {
                                window.particleSystem.addExplosion(bx, by, '#38bdf8');
                                window.particleSystem.addFloatingText('SMASHED!', bx, by, '#38bdf8');
                            }
                            if (window.onScoreAdd) window.onScoreAdd(100);
                        } else {
                            if (bird.handleCollision()) return true;
                        }
                    }
                }
            }
        }

        return false;
    }

    draw(ctx, canvasHeight) {
        // Draw Finish Gate if active
        if (this.finishGate) {
            ctx.save();
            ctx.translate(this.finishGate.x, this.finishGate.y);
            const rot = Date.now() * 0.003;
            ctx.rotate(rot);

            ctx.strokeStyle = this.finishGate.color;
            ctx.lineWidth = 6;
            ctx.shadowColor = this.finishGate.color;
            ctx.shadowBlur = 20;

            // Swirling portal rings
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.ellipse(0, 0, this.finishGate.radius - i * 10, (this.finishGate.radius - i * 10) * 0.55, i * 0.7, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.beginPath();
            ctx.arc(0, 0, 18, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        // Draw Pipes
        for (const p of this.pipes) {
            ctx.save();

            // Pipe Gradient
            const grad = ctx.createLinearGradient(p.x, 0, p.x + p.width, 0);
            grad.addColorStop(0, p.color);
            grad.addColorStop(0.35, p.accentColor);
            grad.addColorStop(1, p.color);

            ctx.fillStyle = grad;
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2.5;

            // Top Pipe Body
            ctx.fillRect(p.x, 0, p.width, p.topHeight);
            ctx.strokeRect(p.x, 0, p.width, p.topHeight);

            // Top Pipe Rim Cap
            const rimH = 22;
            ctx.fillStyle = p.accentColor;
            ctx.fillRect(p.x - 3, p.topHeight - rimH, p.width + 6, rimH);
            ctx.strokeRect(p.x - 3, p.topHeight - rimH, p.width + 6, rimH);

            // Bottom Pipe Body
            ctx.fillStyle = grad;
            ctx.fillRect(p.x, p.bottomY, p.width, p.bottomHeight);
            ctx.strokeRect(p.x, p.bottomY, p.width, p.bottomHeight);

            // Bottom Pipe Rim Cap
            ctx.fillStyle = p.accentColor;
            ctx.fillRect(p.x - 3, p.bottomY, p.width + 6, rimH);
            ctx.strokeRect(p.x - 3, p.bottomY, p.width + 6, rimH);

            // Breakable Barrier
            if (p.hasBreakable && !p.breakableDestroyed) {
                ctx.fillStyle = '#ef4444';
                ctx.strokeStyle = '#fca5a5';
                ctx.lineWidth = 2;
                ctx.shadowColor = '#ef4444';
                ctx.shadowBlur = 8;
                ctx.fillRect(p.x + 2, p.breakableY, p.width - 4, p.breakableHeight);
                ctx.strokeRect(p.x + 2, p.breakableY, p.width - 4, p.breakableHeight);

                // Warning hazard stripes
                ctx.strokeStyle = '#fee2e2';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(p.x + 6, p.breakableY + 4);
                ctx.lineTo(p.x + p.width - 6, p.breakableY + p.breakableHeight - 4);
                ctx.stroke();
            }

            ctx.restore();
        }

        // Draw Collectibles
        for (const c of this.collectibles) {
            ctx.save();
            ctx.translate(c.x, c.y);

            if (c.type === 'energy') {
                // Glowing cyan energy spark
                ctx.shadowColor = '#38bdf8';
                ctx.shadowBlur = 10;
                ctx.fillStyle = '#38bdf8';

                ctx.beginPath();
                ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(0, 0, c.radius * 0.45, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Golden Star Coin
                ctx.shadowColor = '#facc15';
                ctx.shadowBlur = 12;
                ctx.fillStyle = '#facc15';

                // Draw 5-pointed mini star
                ctx.beginPath();
                for (let s = 0; s < 5; s++) {
                    const angle = (s * 4 * Math.PI) / 5 - Math.PI / 2;
                    const r = c.radius;
                    const sx = Math.cos(angle) * r;
                    const sy = Math.sin(angle) * r;
                    if (s === 0) ctx.moveTo(sx, sy);
                    else ctx.lineTo(sx, sy);
                }
                ctx.closePath();
                ctx.fill();
            }

            ctx.restore();
        }
    }
}

window.ObstacleManager = ObstacleManager;
