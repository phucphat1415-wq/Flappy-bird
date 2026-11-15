// Flappy Aero - Level Configurations & Skill Progression
const LEVELS_CONFIG = [
    {
        id: 1,
        name: "Stage 1: Emerald Grove",
        subtitle: "Awakening & The Aero Dash",
        description: "Learn the fundamentals of flight with your thin, agile swift. Pass through the grove to unlock Aero Dash!",
        unlockedSkill: "dash",
        skillTitle: "AERO DASH",
        skillKey: "Shift / J",
        speed: 155,
        gapSize: 140,
        spawnInterval: 2.2,
        targetDistance: 900,
        movingPipes: false,
        oscillateChance: 0,
        breakablePipes: false,
        breakableChance: 0,
        bgGradient: ['#064e3b', '#065f46', '#047857', '#059669', '#10b981'],
        groundColor: '#064e3b',
        pipeColor: '#047857',
        pipeAccent: '#34d399',
        portalColor: '#34d399'
    },
    {
        id: 2,
        name: "Stage 2: Crystal Caverns",
        subtitle: "Shifting Depths & Kinetic Shield",
        description: "Underground stalactites shift up and down. Harness the Kinetic Shield to absorb devastating collisions!",
        unlockedSkill: "shield",
        skillTitle: "KINETIC SHIELD",
        skillKey: "E / K",
        speed: 175,
        gapSize: 130,
        spawnInterval: 2.0,
        targetDistance: 1100,
        movingPipes: true,
        oscillateChance: 0.35,
        breakablePipes: false,
        breakableChance: 0,
        bgGradient: ['#3b0764', '#581c87', '#6b21a8', '#7e22ce', '#9333ea'],
        groundColor: '#3b0764',
        pipeColor: '#7e22ce',
        pipeAccent: '#c084fc',
        portalColor: '#c084fc'
    },
    {
        id: 3,
        name: "Stage 3: Neon Foundry",
        subtitle: "Industrial Hazards & Sonic Dart",
        description: "Dense factory pipes and breakable reinforced barriers. Deploy your Sonic Dart to blast passages open!",
        unlockedSkill: "dart",
        skillTitle: "SONIC DART",
        skillKey: "F / I",
        speed: 195,
        gapSize: 125,
        spawnInterval: 1.9,
        targetDistance: 1300,
        movingPipes: true,
        oscillateChance: 0.45,
        breakablePipes: true,
        breakableChance: 0.55,
        bgGradient: ['#450a0a', '#7f1d1d', '#991b1b', '#b91c1c', '#dc2626'],
        groundColor: '#450a0a',
        pipeColor: '#991b1b',
        pipeAccent: '#f87171',
        portalColor: '#f87171'
    },
    {
        id: 4,
        name: "Stage 4: Tempest Peaks",
        subtitle: "Turbulence & Chrono Shift",
        description: "Fierce winds and oscillating towers. Activate Chrono Shift slow-motion to navigate needle-thin openings!",
        unlockedSkill: "chrono",
        skillTitle: "CHRONO SHIFT",
        skillKey: "Q / L",
        speed: 215,
        gapSize: 120,
        spawnInterval: 1.8,
        targetDistance: 1500,
        movingPipes: true,
        oscillateChance: 0.6,
        breakablePipes: true,
        breakableChance: 0.4,
        bgGradient: ['#082f49', '#0c4a6e', '#0369a1', '#0284c7', '#0ea5e9'],
        groundColor: '#082f49',
        pipeColor: '#0284c7',
        pipeAccent: '#38bdf8',
        portalColor: '#38bdf8'
    },
    {
        id: 5,
        name: "Stage 5: Quantum Overdrive",
        subtitle: "Mastery of All Dimensions",
        description: "The ultimate trial combining lightning-speed obstacles, shifting gates, and breakable walls. Use all 4 skills to ascend!",
        unlockedSkill: "mastery",
        skillTitle: "ALL SKILLS UNLOCKED",
        skillKey: "1 - 4 Keys",
        speed: 240,
        gapSize: 115,
        spawnInterval: 1.65,
        targetDistance: 1800,
        movingPipes: true,
        oscillateChance: 0.75,
        breakablePipes: true,
        breakableChance: 0.6,
        bgGradient: ['#18181b', '#27272a', '#3f3f46', '#52525b', '#71717a'],
        groundColor: '#18181b',
        pipeColor: '#e11d48',
        pipeAccent: '#fb7185',
        portalColor: '#f43f5e'
    },
    {
        id: 'endless',
        name: "Endless Arcade",
        subtitle: "Infinite Survival",
        description: "Endless procedural gauntlet with all unlocked skills ready. Compete for the ultimate high score!",
        unlockedSkill: "all",
        skillTitle: "ARCADE FREEDOM",
        skillKey: "All Active",
        speed: 190,
        gapSize: 124,
        spawnInterval: 1.8,
        targetDistance: null, // Infinite
        movingPipes: true,
        oscillateChance: 0.5,
        breakablePipes: true,
        breakableChance: 0.45,
        bgGradient: ['#0f172a', '#1e293b', '#334155', '#475569', '#64748b'],
        groundColor: '#0f172a',
        pipeColor: '#06b6d4',
        pipeAccent: '#67e8f9',
        portalColor: '#67e8f9'
    }
];

class LevelManager {
    constructor() {
        this.levels = LEVELS_CONFIG;
        this.unlockedLevelMax = 1;
        this.unlockedSkills = {
            dash: false,
            shield: false,
            chrono: false,
            dart: false
        };
        this.levelStars = {};
        this.highScore = 0;
        this.loadProgress();
    }

    loadProgress() {
        try {
            const saved = localStorage.getItem('flappy_aero_progress');
            if (saved) {
                const data = JSON.parse(saved);
                this.unlockedLevelMax = data.unlockedLevelMax || 1;
                this.unlockedSkills = Object.assign(this.unlockedSkills, data.unlockedSkills || {});
                this.levelStars = data.levelStars || {};
                this.highScore = data.highScore || 0;
            }
        } catch (e) {
            console.warn("Storage access failed, continuing with default progress.", e);
        }
    }

    saveProgress() {
        try {
            const data = {
                unlockedLevelMax: this.unlockedLevelMax,
                unlockedSkills: this.unlockedSkills,
                levelStars: this.levelStars,
                highScore: this.highScore
            };
            localStorage.setItem('flappy_aero_progress', JSON.stringify(data));
        } catch (e) {
            console.warn("Could not save progress.", e);
        }
    }

    getLevel(id) {
        return this.levels.find(lvl => lvl.id === id) || this.levels[0];
    }

    // When a level is finished, unlock the next level and skill!
    completeLevel(levelId, stars = 3) {
        this.levelStars[levelId] = Math.max(this.levelStars[levelId] || 0, stars);

        const currentLvl = this.getLevel(levelId);
        if (currentLvl && currentLvl.unlockedSkill && currentLvl.unlockedSkill !== 'mastery' && currentLvl.unlockedSkill !== 'all') {
            this.unlockedSkills[currentLvl.unlockedSkill] = true;
        }

        if (typeof levelId === 'number') {
            // Level 1 immediately grants dash, and completing level 1 unlocks level 2 etc.
            if (levelId === 1) this.unlockedSkills.dash = true;
            if (levelId === 2) this.unlockedSkills.shield = true;
            if (levelId === 3) this.unlockedSkills.dart = true;
            if (levelId === 4) this.unlockedSkills.chrono = true;

            if (levelId >= this.unlockedLevelMax && levelId < 5) {
                this.unlockedLevelMax = levelId + 1;
            }
        }
        this.saveProgress();
    }

    isSkillAvailable(skillName) {
        return !!this.unlockedSkills[skillName];
    }

    updateHighScore(score) {
        if (score > this.highScore) {
            this.highScore = score;
            this.saveProgress();
            return true;
        }
        return false;
    }
}

window.LEVELS_CONFIG = LEVELS_CONFIG;
window.levelManager = new LevelManager();
