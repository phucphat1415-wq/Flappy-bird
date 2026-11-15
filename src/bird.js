// Flappy Aero - Sleek, Thin & Short Bird Player
class Bird {
    constructor() {
        this.reset();
    }

    reset(startX = 120, startY = 250) {
        // Position & Physics
        this.x = startX;
        this.y = startY;
        this.vy = 0;
        this.rotation = 0;
        
        // "Thin and short" dimensions
        this.width = 24;      // Short body length
        this.height = 11;     // Thin sleek profile
        this.hitboxRadiusX = 11;
        this.hitboxRadiusY = 5;

        this.gravity = 920;
        this.flapPower = -300;
        this.maxFallSpeed = 480;

        // Energy & Skills
        this.maxEnergy = 100;
        this.energy = 100;
        this.energyRegenRate = 12; // per second

        // Active skill states
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashDuration = 0.32;

        this.hasShield = false;
        this.isShieldBreaking = false;
        this.shieldBreakTimer = 0;
        this.shieldBreakDuration = 1.0; // 1 second animation before breaking!
        this.shieldTimer = 0;
        this.maxShieldDuration = 8.0;

        this.isChronoActive = false;
        this.chronoTimer = 0;
        this.chronoDuration = 3.5;

        // Projectiles fired by Sonic Dart
        this.projectiles = [];

        // Animation timing
        this.wingTimer = 0;
        this.trailTimer = 0;
        this.isAlive = true;
    }

    flap() {
        if (!this.isAlive) return;
        this.vy = this.flapPower;
        this.rotation = -0.45; // ~-26 degrees up
        
        if (window.soundEngine) {
            window.soundEngine.playFlap();
        }
        if (window.particleSystem) {
            window.particleSystem.addFlapPuff(this.x, this.y);
        }
    }

    // Skill 1: Aero Dash (Surges forward, invulnerable)
    activateDash() {
        if (!this.isAlive || this.energy < 30 || this.isDashing) return false;
        this.energy -= 30;
        this.isDashing = true;
        this.dashTimer = this.dashDuration;
        this.vy = 0; // stabilize height

        if (window.soundEngine) window.soundEngine.playDash();
        if (window.particleSystem) {
            window.particleSystem.addDashBurst(this.x, this.y);
            window.particleSystem.addFloatingText('AERO DASH!', this.x + 30, this.y - 15, '#38bdf8');
        }
        return true;
    }

    // Skill 2: Kinetic Shield (Absorbs 1 collision with 1s break animation)
    activateShield() {
        if (!this.isAlive || this.energy < 40 || this.hasShield || this.isShieldBreaking) return false;
        this.energy -= 40;
        this.hasShield = true;
        this.isShieldBreaking = false;
        this.shieldBreakTimer = 0;
        this.shieldTimer = this.maxShieldDuration;

        if (window.soundEngine) window.soundEngine.playShieldActivate();
        if (window.particleSystem) {
            window.particleSystem.addShieldPulse(this.x, this.y);
            window.particleSystem.addFloatingText('SHIELD UP!', this.x + 30, this.y - 15, '#c084fc');
        }
        return true;
    }

    // Skill 3: Chrono Shift (Bullet time slow motion)
    activateChrono() {
        if (!this.isAlive || this.energy < 35 || this.isChronoActive) return false;
        this.energy -= 35;
        this.isChronoActive = true;
        this.chronoTimer = this.chronoDuration;

        if (window.soundEngine) window.soundEngine.playChronoStart();
        if (window.particleSystem) {
            window.particleSystem.addFloatingText('CHRONO SLOW!', this.x + 30, this.y - 15, '#fbbf24');
        }
        return true;
    }

    // Skill 4: Sonic Dart (Destroys obstacles ahead)
    activateSonicDart() {
        if (!this.isAlive || this.energy < 25) return false;
        this.energy -= 25;

        // Spawn projectile
        this.projectiles.push({
            x: this.x + 16,
            y: this.y,
            vx: 750,
            radius: 5,
            life: 1.2
        });

        if (window.soundEngine) window.soundEngine.playSonicDart();
        if (window.particleSystem) {
            window.particleSystem.addFloatingText('SONIC DART!', this.x + 30, this.y - 15, '#ef4444');
        }
        return true;
    }

    update(dt, canvasHeight) {
        if (!this.isAlive) {
            // Drop to ground when dead
            this.vy += this.gravity * dt;
            this.y += this.vy * dt;
            this.rotation = Math.min(Math.PI / 2, this.rotation + 4 * dt);
            if (this.y > canvasHeight - this.height) {
                this.y = canvasHeight - this.height;
            }
            return;
        }

        // Energy Regeneration
        this.energy = Math.min(this.maxEnergy, this.energy + this.energyRegenRate * dt);

        // Dash handling
        if (this.isDashing) {
            this.dashTimer -= dt;
            this.vy = 0; // maintain hover during dash
            if (this.dashTimer <= 0) {
                this.isDashing = false;
            }
            if (window.particleSystem) {
                window.particleSystem.addTrail(this.x, this.y, '#38bdf8');
            }
        } else {
            // Standard gravity physics
            this.vy += this.gravity * dt;
            if (this.vy > this.maxFallSpeed) this.vy = this.maxFallSpeed;
            this.y += this.vy * dt;

            // Smooth rotation towards dive
            if (this.vy > 100) {
                this.rotation = Math.min(1.1, this.rotation + 3.0 * dt);
            }
        }

        // Shield countdown & 1-second break animation
        if (this.isShieldBreaking) {
            this.shieldBreakTimer -= dt;

            // Emit electrical crack sparks during the 1-second breaking animation
            if (Math.random() < 0.45 && window.particleSystem) {
                const angle = Math.random() * Math.PI * 2;
                const r = this.hitboxRadiusX + 8;
                window.particleSystem.particles.push({
                    x: this.x + Math.cos(angle) * r,
                    y: this.y + Math.sin(angle) * r,
                    vx: (Math.random() - 0.5) * 80,
                    vy: (Math.random() - 0.5) * 80,
                    size: 2.5 + Math.random() * 2,
                    color: Math.random() > 0.5 ? '#f43f5e' : '#fef08a',
                    alpha: 1.0,
                    decay: 4.0,
                    shrink: 2,
                    type: 'spark'
                });
            }

            // 1-second animation finished: shatter into shards!
            if (this.shieldBreakTimer <= 0) {
                this.isShieldBreaking = false;
                this.hasShield = false;
                if (window.soundEngine) window.soundEngine.playShieldBreak();
                if (window.particleSystem) {
                    window.particleSystem.addShieldShatter(this.x, this.y);
                    window.particleSystem.addFloatingText('SHIELD SHATTERED!', this.x, this.y - 20, '#f43f5e');
                }
            }
        } else if (this.hasShield) {
            this.shieldTimer -= dt;
            if (this.shieldTimer <= 0) {
                this.hasShield = false;
            }
        }

        // Chrono countdown
        if (this.isChronoActive) {
            this.chronoTimer -= dt;
            if (this.chronoTimer <= 0) {
                this.isChronoActive = false;
            }
        }

        // Update Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx * dt;
            p.life -= dt;
            if (p.life <= 0 || p.x > 1000) {
                this.projectiles.splice(i, 1);
            }
        }

        // Wing fluttering animation
        this.wingTimer += (this.isDashing ? 32 : 16) * dt;

        // Passive speed trail
        this.trailTimer += dt;
        if (this.trailTimer > 0.06 && window.particleSystem) {
            this.trailTimer = 0;
            const trailColor = this.isDashing ? '#38bdf8' : (this.hasShield ? '#c084fc' : '#22d3ee');
            window.particleSystem.addTrail(this.x, this.y, trailColor);
        }

        // Top ceiling clamp
        if (this.y < this.height) {
            this.y = this.height;
            this.vy = 0;
        }
    }

    draw(ctx) {
        // Draw Projectiles
        ctx.save();
        for (const p of this.projectiles) {
            ctx.shadowColor = '#f87171';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, 8, 3, 0, 0, Math.PI * 2);
            ctx.fill();

            // Projectile needle head
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.moveTo(p.x + 8, p.y);
            ctx.lineTo(p.x + 13, p.y);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.restore();

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Kinetic Shield rendering (Normal or 1-Second Breaking Animation)
        if (this.hasShield || this.isShieldBreaking) {
            ctx.save();
            const pulse = 1 + 0.08 * Math.sin(Date.now() * 0.008);

            if (this.isShieldBreaking) {
                // 1-second cracking animation calculations
                const progress = Math.min(1.0, Math.max(0, 1 - (this.shieldBreakTimer / this.shieldBreakDuration)));
                const shakeX = (Math.random() - 0.5) * (3 + progress * 4);
                const shakeY = (Math.random() - 0.5) * (3 + progress * 4);
                ctx.translate(shakeX, shakeY);

                // Flickering unstable warning colors
                const isFlicker = Math.floor(Date.now() / 45) % 2 === 0;
                const strokeCol = isFlicker ? '#f43f5e' : (Math.random() > 0.5 ? '#ffffff' : '#fb923c');
                ctx.strokeStyle = strokeCol;
                ctx.lineWidth = 2.5 + progress * 2;
                ctx.fillStyle = isFlicker ? 'rgba(244, 63, 94, 0.35)' : 'rgba(251, 146, 60, 0.2)';
                ctx.shadowColor = '#f43f5e';
                ctx.shadowBlur = 14 + progress * 10;

                // Destabilizing outer shield perimeter
                ctx.beginPath();
                ctx.ellipse(0, 0, (this.hitboxRadiusX + 8) * pulse, (this.hitboxRadiusY + 8) * pulse, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Dynamic spreading fracture cracks across the shield
                ctx.save();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5 + progress * 1.5;
                ctx.shadowColor = '#fff';
                ctx.shadowBlur = 6;

                // Main fissure
                ctx.beginPath();
                ctx.moveTo(-10, -4);
                ctx.lineTo(-4, -1);
                ctx.lineTo(2 * progress, -5 * progress);
                ctx.lineTo(7 * progress, -2 * progress);
                ctx.lineTo(13 * progress, 3 * progress);
                // Branching fissure 1
                ctx.moveTo(-4, -1);
                ctx.lineTo(-2, 4 * progress);
                ctx.lineTo(5 * progress, 6 * progress);
                // Branching fissure 2
                ctx.moveTo(2 * progress, -5 * progress);
                ctx.lineTo(4 * progress, -9 * progress);
                ctx.stroke();
                ctx.restore();

                // Warning crack timer ring (drains clockwise as 1s passes)
                ctx.strokeStyle = 'rgba(244, 63, 94, 0.85)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, (this.hitboxRadiusX + 11), -Math.PI / 2, -Math.PI / 2 + (1 - progress) * Math.PI * 2);
                ctx.stroke();
            } else {
                // Normal stable shield
                ctx.strokeStyle = '#c084fc';
                ctx.lineWidth = 2;
                ctx.fillStyle = 'rgba(192, 132, 252, 0.2)';
                ctx.shadowColor = '#a855f7';
                ctx.shadowBlur = 12;

                ctx.beginPath();
                ctx.ellipse(0, 0, (this.hitboxRadiusX + 8) * pulse, (this.hitboxRadiusY + 8) * pulse, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Hexagonal shield lattice lines
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(0, 0, (this.hitboxRadiusX + 6) * pulse, -0.6, 0.6);
                ctx.stroke();
            }

            ctx.restore();
        }

        // Dash after-glow aura
        if (this.isDashing) {
            ctx.save();
            ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 16;
            ctx.beginPath();
            ctx.ellipse(0, 0, this.width * 0.8, this.height * 1.4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Chrono distortion aura
        if (this.isChronoActive) {
            ctx.save();
            ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, 20 + Math.sin(Date.now() * 0.01) * 3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // --- DRAW THIN & SHORT BIRD BODY ---
        // Sleek dart / swift body gradient
        const bodyGrad = ctx.createLinearGradient(-this.width / 2, 0, this.width / 2, 0);
        bodyGrad.addColorStop(0, '#0284c7');     // Deep sky blue at tail
        bodyGrad.addColorStop(0.6, '#38bdf8');   // Bright cyan in midsection
        bodyGrad.addColorStop(1, '#a7f3d0');     // Sleek mint at nose

        ctx.fillStyle = bodyGrad;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 6;

        // Needle/dart sleek body path: thin (height ~10-11px), short (length ~24px)
        ctx.beginPath();
        ctx.moveTo(this.width / 2, 0); // sharp nose
        ctx.quadraticCurveTo(this.width / 4, -this.height / 2, -this.width / 3, -this.height / 2.2); // top streamline
        ctx.lineTo(-this.width / 2, -1); // needle tail top
        ctx.lineTo(-this.width / 1.6, 0); // tail tip
        ctx.lineTo(-this.width / 2, 1); // needle tail bottom
        ctx.lineTo(-this.width / 3, this.height / 2.2); // bottom streamline
        ctx.quadraticCurveTo(this.width / 4, this.height / 2, this.width / 2, 0); // up to nose
        ctx.closePath();
        ctx.fill();

        // Golden sharp beak tip
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(this.width / 2 - 2, -2);
        ctx.lineTo(this.width / 2 + 5, 0);
        ctx.lineTo(this.width / 2 - 2, 2);
        ctx.closePath();
        ctx.fill();

        // Swift fluttering wing (thin & short)
        const wingFlapOffset = Math.sin(this.wingTimer) * 5;
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.moveTo(-2, 0);
        ctx.quadraticCurveTo(-6, -7 + wingFlapOffset, -12, -4 + wingFlapOffset);
        ctx.lineTo(-7, 1);
        ctx.closePath();
        ctx.fill();

        // Eye: Glowing cybernetic / avian eye
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.width / 4, -2, 2.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(this.width / 4 + 0.5, -2, 1.1, 0, Math.PI * 2);
        ctx.fill();

        // Eye glint
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(this.width / 4 + 0.8, -2.4, 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // Get simplified collision boundary (ellipse / circles)
    getHitbox() {
        return {
            x: this.x,
            y: this.y,
            rx: this.hitboxRadiusX,
            ry: this.hitboxRadiusY,
            isDashing: this.isDashing,
            hasShield: this.hasShield || this.isShieldBreaking
        };
    }

    // Call when bird collides with an obstacle
    handleCollision() {
        if (this.isDashing) {
            // Invulnerable while dashing!
            return false;
        }

        // Protected while shield is in 1-second breaking animation!
        if (this.isShieldBreaking) {
            this.vy = -120;
            return false;
        }

        // Shield hit: begin 1-second breaking animation before final shatter!
        if (this.hasShield) {
            this.isShieldBreaking = true;
            this.shieldBreakTimer = this.shieldBreakDuration; // 1.0s
            if (window.soundEngine && window.soundEngine.playShieldCrack) {
                window.soundEngine.playShieldCrack();
            }
            if (window.particleSystem) {
                window.particleSystem.addFloatingText('SHIELD CRACKED!', this.x, this.y - 20, '#f43f5e');
            }
            // Small bounce to prevent instant re-collision
            this.vy = -160;
            return false;
        }

        // Lethal hit
        this.isAlive = false;
        if (window.soundEngine) window.soundEngine.playCrash();
        if (window.particleSystem) {
            window.particleSystem.addExplosion(this.x, this.y, '#ef4444');
            window.particleSystem.addFloatingText('CRASH!', this.x, this.y - 20, '#ef4444');
        }
        return true;
    }
}

window.Bird = Bird;
