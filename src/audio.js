// Flappy Aero - Procedural Web Audio API Sound Synthesizer
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.soundEnabled = true;
        this.musicEnabled = true;
        this.musicInterval = null;
        this.musicStep = 0;
        this.tempo = 130;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Flap wing sound: rapid pitch-modulated swoosh
    playFlap() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(580, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    // Aero Dash sound: energetic blast with low-end punch
    playDash() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        
        // High sweep
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(950, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.28);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.28);

        // Noise burst
        this.playNoise(0.2, 0.2, 600);
    }

    // Kinetic Shield activation sound: resonant crystalline chime
    playShieldActivate() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.04);
            gain.gain.setValueAtTime(0.15, now + i * 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.04);
            osc.stop(now + i * 0.04 + 0.35);
        });
    }

    // Shield crack sound: initial impact fracture & electric stress
    playShieldCrack() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);

        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);

        this.playNoise(0.12, 0.25, 2000);
    }

    // Shield break sound: glass/forcefield shatter
    playShieldBreak() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);

        this.playNoise(0.3, 0.3, 1200);
    }

    // Chrono Shift sound: time-warp pitch drop
    playChronoStart() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.4);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
    }

    // Sonic Dart blast sound: high speed laser/projectile
    playSonicDart() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.16);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
    }

    // Explosion / Breakable obstacle smash sound
    playExplosion() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;

        this.playNoise(0.35, 0.4, 400);

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
    }

    // Energy spark / star coin pickup
    playSparkPickup() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        [587.33, 880.00, 1174.66].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.05);
            gain.gain.setValueAtTime(0.18, now + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.18);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.05);
            osc.stop(now + i * 0.05 + 0.18);
        });
    }

    // Level Cleared Victory Fanfare
    playVictory() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [
            { f: 523.25, t: 0.00, d: 0.12 }, // C5
            { f: 659.25, t: 0.12, d: 0.12 }, // E5
            { f: 783.99, t: 0.24, d: 0.12 }, // G5
            { f: 1046.5, t: 0.36, d: 0.35 }, // C6
            { f: 987.77, t: 0.72, d: 0.12 }, // B5
            { f: 1046.5, t: 0.84, d: 0.55 }, // C6 long
        ];

        notes.forEach(n => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(n.f, now + n.t);

            gain.gain.setValueAtTime(0.25, now + n.t);
            gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + n.t);
            osc.stop(now + n.t + n.d);
        });
    }

    // Crash / Game Over sound
    playCrash() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;

        this.playNoise(0.4, 0.5, 300);

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.5);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
    }

    // Helper: Noise buffer for impacts & thuds
    playNoise(duration, volume, cutoffFreq) {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = cutoffFreq || 800;

        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
        noise.stop(now + duration);
    }

    // Ambient Synth Music Loop
    startMusic() {
        if (!this.musicEnabled || this.musicInterval) return;
        this.init();
        if (!this.ctx) return;

        const bassline = [110, 110, 130.81, 146.83, 98, 98, 123.47, 130.81];
        const leadScale = [440, 523.25, 587.33, 659.25, 783.99, 880];

        this.musicStep = 0;
        this.musicInterval = setInterval(() => {
            if (!this.musicEnabled || !this.ctx) return;

            const now = this.ctx.currentTime;
            const bassFreq = bassline[this.musicStep % bassline.length];
            
            // Bass pulse
            const bOsc = this.ctx.createOscillator();
            const bGain = this.ctx.createGain();
            bOsc.type = 'triangle';
            bOsc.frequency.setValueAtTime(bassFreq, now);
            bGain.gain.setValueAtTime(0.06, now);
            bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            bOsc.connect(bGain);
            bGain.connect(this.ctx.destination);
            bOsc.start(now);
            bOsc.stop(now + 0.22);

            // Occasional melodic synth shimmer
            if (this.musicStep % 2 === 0 && Math.random() > 0.3) {
                const leadFreq = leadScale[Math.floor(Math.random() * leadScale.length)];
                const lOsc = this.ctx.createOscillator();
                const lGain = this.ctx.createGain();
                lOsc.type = 'sine';
                lOsc.frequency.setValueAtTime(leadFreq, now);
                lGain.gain.setValueAtTime(0.035, now);
                lGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                lOsc.connect(lGain);
                lGain.connect(this.ctx.destination);
                lOsc.start(now);
                lOsc.stop(now + 0.3);
            }

            this.musicStep++;
        }, 60000 / (this.tempo * 2));
    }

    stopMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        return this.soundEnabled;
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (!this.musicEnabled) {
            this.stopMusic();
        } else {
            this.startMusic();
        }
        return this.musicEnabled;
    }
}

window.soundEngine = new SoundEngine();
