// Flappy Aero - Particle & Visual Effects Engine
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.rings = [];
        this.floatingTexts = [];
    }

    reset() {
        this.particles = [];
        this.rings = [];
        this.floatingTexts = [];
    }

    update(dt, timeScale = 1.0) {
        const effectiveDt = dt * timeScale;

        // Update standard particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * effectiveDt;
            p.y += p.vy * effectiveDt;
            p.vy += (p.gravity || 0) * effectiveDt;
            p.alpha -= p.decay * effectiveDt;
            p.size = Math.max(0, p.size - (p.shrink || 0) * effectiveDt);
            p.rotation += (p.vRot || 0) * effectiveDt;

            if (p.alpha <= 0 || p.size <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update shockwave rings
        for (let i = this.rings.length - 1; i >= 0; i--) {
            const r = this.rings[i];
            r.radius += r.expansionSpeed * effectiveDt;
            r.alpha -= r.decay * effectiveDt;
            r.lineWidth = Math.max(0.5, r.lineWidth - r.decayLineWidth * effectiveDt);

            if (r.alpha <= 0) {
                this.rings.splice(i, 1);
            }
        }

        // Update floating combat/score text
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const t = this.floatingTexts[i];
            t.y -= t.speedY * effectiveDt;
            t.alpha -= t.decay * effectiveDt;
            t.scale = Math.min(1.2, t.scale + 0.4 * effectiveDt);

            if (t.alpha <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        ctx.save();

        // Draw rings
        for (const r of this.rings) {
            ctx.save();
            ctx.strokeStyle = r.color;
            ctx.globalAlpha = Math.max(0, r.alpha);
            ctx.lineWidth = r.lineWidth;
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Draw particles
        for (const p of this.particles) {
            ctx.save();
            ctx.translate(p.x, p.y);
            if (p.rotation) ctx.rotate(p.rotation);
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = p.color;

            if (p.type === 'circle') {
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'spark') {
                ctx.beginPath();
                ctx.moveTo(-p.size * 1.5, 0);
                ctx.lineTo(p.size * 1.5, 0);
                ctx.moveTo(0, -p.size * 1.5);
                ctx.lineTo(0, p.size * 1.5);
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            } else if (p.type === 'shard') {
                ctx.beginPath();
                ctx.moveTo(-p.size, -p.size / 2);
                ctx.lineTo(p.size, 0);
                ctx.lineTo(-p.size / 2, p.size);
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            }
            ctx.restore();
        }

        // Draw floating text
        for (const t of this.floatingTexts) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, t.alpha);
            ctx.font = `900 ${Math.floor(14 * t.scale)}px "Segoe UI", sans-serif`;
            ctx.fillStyle = t.color;
            ctx.shadowColor = t.color;
            ctx.shadowBlur = 8;
            ctx.textAlign = 'center';
            ctx.fillText(t.text, t.x, t.y);
            ctx.restore();
        }

        ctx.restore();
    }

    // Wing flap exhaust puffs
    addFlapPuff(x, y) {
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI + (Math.random() * 0.8 - 0.4);
            const speed = 60 + Math.random() * 80;
            this.particles.push({
                x: x - 10,
                y: y + (Math.random() * 6 - 3),
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 3,
                color: '#67e8f9',
                alpha: 0.8,
                decay: 2.5,
                shrink: 3,
                type: 'circle'
            });
        }
    }

    // High-speed jet trail
    addTrail(x, y, color = '#38bdf8') {
        this.particles.push({
            x: x - 8,
            y: y + (Math.random() * 3 - 1.5),
            vx: -90 - Math.random() * 40,
            vy: (Math.random() - 0.5) * 20,
            size: 2.5 + Math.random() * 2,
            color: color,
            alpha: 0.7,
            decay: 3.5,
            shrink: 2,
            type: 'circle'
        });
    }

    // Aero Dash shockwave
    addDashBurst(x, y) {
        this.rings.push({
            x: x,
            y: y,
            radius: 5,
            expansionSpeed: 280,
            lineWidth: 4,
            decayLineWidth: 4,
            alpha: 1.0,
            decay: 2.2,
            color: '#38bdf8'
        });

        for (let i = 0; i < 22; i++) {
            const angle = Math.PI + (Math.random() * 1.6 - 0.8);
            const speed = 120 + Math.random() * 200;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 4,
                color: Math.random() > 0.4 ? '#38bdf8' : '#e0f2fe',
                alpha: 1.0,
                decay: 2.0,
                shrink: 3,
                type: 'shard'
            });
        }
    }

    // Kinetic Shield activation pulse
    addShieldPulse(x, y) {
        this.rings.push({
            x: x,
            y: y,
            radius: 12,
            expansionSpeed: 90,
            lineWidth: 3,
            decayLineWidth: 2,
            alpha: 0.9,
            decay: 2.0,
            color: '#a855f7'
        });
    }

    // Shield shatter shards
    addShieldShatter(x, y) {
        this.rings.push({
            x: x,
            y: y,
            radius: 20,
            expansionSpeed: 200,
            lineWidth: 4,
            decayLineWidth: 5,
            alpha: 1.0,
            decay: 3.0,
            color: '#c084fc'
        });

        for (let i = 0; i < 25; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 180;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 4 + Math.random() * 4,
                color: '#d8b4fe',
                alpha: 1.0,
                decay: 2.0,
                shrink: 3,
                rotation: Math.random() * Math.PI,
                vRot: (Math.random() - 0.5) * 8,
                type: 'shard'
            });
        }
    }

    // Obstacle explosion / Sonic Dart hit
    addExplosion(x, y, color = '#f97316') {
        this.rings.push({
            x: x,
            y: y,
            radius: 8,
            expansionSpeed: 220,
            lineWidth: 5,
            decayLineWidth: 5,
            alpha: 1.0,
            decay: 3.5,
            color: color
        });

        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 220;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                gravity: 300,
                size: 3 + Math.random() * 5,
                color: Math.random() > 0.5 ? color : '#fef08a',
                alpha: 1.0,
                decay: 1.8,
                shrink: 2,
                rotation: Math.random() * Math.PI,
                vRot: (Math.random() - 0.5) * 10,
                type: 'shard'
            });
        }
    }

    // Star / Spark collectible pickup
    addSparkle(x, y, color = '#facc15') {
        for (let i = 0; i < 16; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 110;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 3,
                color: color,
                alpha: 1.0,
                decay: 2.2,
                shrink: 2.5,
                type: 'spark'
            });
        }
    }

    // Floating text feedback (e.g. "+100", "SHIELD BREAK!", "DASH!")
    addFloatingText(text, x, y, color = '#ffffff') {
        this.floatingTexts.push({
            text: text,
            x: x,
            y: y,
            speedY: 45,
            scale: 0.8,
            alpha: 1.0,
            decay: 1.2,
            color: color
        });
    }
}

window.particleSystem = new ParticleSystem();
