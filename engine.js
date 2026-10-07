/**
 * engine.js
 * Core Game Engine: Procedural 23x23 Map Generator, Random Exit Ending Point,
 * Distinct Themed Block Wall Renderers, LoS Hunter AI, Audio Synthesizer,
 * Dynamic Power-Up Objects, and Responsive HUD.
 */

import { MAPS, generateProceduralMap } from './maps.js';
import { Player, Hunter, HunterState, HUNTER_PROFILES } from './entities.js';
import { ObjectType, generateRandomObjects } from './objects.js';

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('maze_runner_muted') === 'true';
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('maze_runner_muted', this.muted);
    return this.muted;
  }

  step() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  gem() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    [659.25, 1046.50].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.05);
      gain.gain.setValueAtTime(0.09, this.ctx.currentTime + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.05 + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + i * 0.05);
      osc.stop(this.ctx.currentTime + i * 0.05 + 0.14);
    });
  }

  powerup() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(980, this.ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.22);
  }

  freezeChime() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    [587.33, 880.0, 1174.66].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.04);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.04 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + i * 0.04);
      osc.stop(this.ctx.currentTime + i * 0.04 + 0.25);
    });
  }

  shieldDeflect() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.28);
    gain.gain.setValueAtTime(0.16, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.28);
  }

  alert() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  defeat() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const notes = [320, 260, 210, 150];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.08);
      gain.gain.setValueAtTime(0.09, this.ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.08 + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + i * 0.08);
      osc.stop(this.ctx.currentTime + i * 0.08 + 0.2);
    });
  }

  victory() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.08);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.08 + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + i * 0.08);
      osc.stop(this.ctx.currentTime + i * 0.08 + 0.28);
    });
  }
}

export class GameEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.sound = new SoundEngine();

    // Configuration
    this.selectedMapId = 1;
    this.hunterCount = 3;
    this.difficulty = localStorage.getItem('maze_runner_diff') || 'hard';

    // States: 'HOMEPAGE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'VICTORY'
    this.gameState = 'HOMEPAGE';

    // Entities & Map System (23x23)
    this.currentMap = generateProceduralMap(1);
    this.player = new Player(1, 1);
    this.hunters = [];
    this.mapObjects = [];

    // Active Power-Up Buff Timers
    this.speedTimer = 0;
    this.freezeTimer = 0;
    this.smokeTimer = 0;

    // Metrics
    this.startTime = 0;
    this.elapsedTime = 0;
    this.lastFrameTime = performance.now();
    this.particles = [];
    this.gemsCollected = 0;
    this.totalGems = 0;
    this.score = 0;
    this.hudToastText = '';
    this.hudToastTimer = 0;

    // High Scores
    this.highScores = JSON.parse(localStorage.getItem('maze_runner_records') || '{}');

    this.initDOM();
    this.bindEvents();
    this.resizeCanvas();
    this.startLoop();
  }

  initDOM() {
    this.updateAudioButton();
    this.renderHomepageSelection();
    this.renderRecordsTable();
  }

  bindEvents() {
    // Keyboard Controls
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      if (this.gameState === 'PLAYING') {
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          this.togglePause();
          return;
        }

        // R to re-roll a new random map
        if (e.key === 'r' || e.key === 'R') {
          this.startLevel(this.selectedMapId);
          return;
        }

        let moved = false;
        switch (e.key) {
          case 'ArrowUp':
          case 'w':
          case 'W':
            moved = this.player.move(0, -1, this.currentMap.grid, this.currentMap.width, this.currentMap.height);
            break;
          case 'ArrowDown':
          case 's':
          case 'S':
            moved = this.player.move(0, 1, this.currentMap.grid, this.currentMap.width, this.currentMap.height);
            break;
          case 'ArrowLeft':
          case 'a':
          case 'A':
            moved = this.player.move(-1, 0, this.currentMap.grid, this.currentMap.width, this.currentMap.height);
            break;
          case 'ArrowRight':
          case 'd':
          case 'D':
            moved = this.player.move(1, 0, this.currentMap.grid, this.currentMap.width, this.currentMap.height);
            break;
        }

        if (moved) {
          this.sound.step();
          this.checkObjectPickups();
          this.updateHUD();
          this.checkCollisions();
          this.checkVictory();
        }
      }
    });

    // Touch D-Pad Controls
    const dpadMap = [
      { id: 'dpadUp', dx: 0, dy: -1 },
      { id: 'dpadDown', dx: 0, dy: 1 },
      { id: 'dpadLeft', dx: -1, dy: 0 },
      { id: 'dpadRight', dx: 1, dy: 0 }
    ];
    dpadMap.forEach(d => {
      const btn = document.getElementById(d.id);
      if (btn) {
        btn.addEventListener('click', () => {
          if (this.gameState === 'PLAYING') {
            const moved = this.player.move(d.dx, d.dy, this.currentMap.grid, this.currentMap.width, this.currentMap.height);
            if (moved) {
              this.sound.step();
              this.checkObjectPickups();
              this.updateHUD();
              this.checkCollisions();
              this.checkVictory();
            }
          }
        });
      }
    });

    // Audio Toggle
    const btnAudio = document.getElementById('btnAudioToggle');
    if (btnAudio) {
      btnAudio.addEventListener('click', () => {
        this.sound.toggleMute();
        this.updateAudioButton();
      });
    }

    // Top Navigation Actions
    const btnExitHome = document.getElementById('btnExitHome');
    if (btnExitHome) {
      btnExitHome.addEventListener('click', () => this.exitToHomepage());
    }

    const btnRestartLevel = document.getElementById('btnRestartLevel');
    if (btnRestartLevel) {
      btnRestartLevel.addEventListener('click', () => this.startLevel(this.selectedMapId));
    }

    const btnRerollMap = document.getElementById('btnRerollMap');
    if (btnRerollMap) {
      btnRerollMap.addEventListener('click', () => this.startLevel(this.selectedMapId));
    }

    const btnPause = document.getElementById('btnPauseGame');
    if (btnPause) {
      btnPause.addEventListener('click', () => this.togglePause());
    }

    // Homepage Menu Actions
    const btnStartGame = document.getElementById('btnStartGame');
    if (btnStartGame) {
      btnStartGame.addEventListener('click', () => {
        this.sound.init();
        this.startLevel(this.selectedMapId);
      });
    }

    // Difficulty selection buttons
    const diffButtons = document.querySelectorAll('.diff-select-btn');
    diffButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.difficulty = btn.getAttribute('data-diff');
        localStorage.setItem('maze_runner_diff', this.difficulty);
        this.renderHomepageSelection();
      });
    });

    // Modal Action Buttons
    const btnRetryOver = document.getElementById('btnRetryOver');
    if (btnRetryOver) {
      btnRetryOver.addEventListener('click', () => {
        this.closeModals();
        this.startLevel(this.selectedMapId);
      });
    }

    const btnHomeOver = document.getElementById('btnHomeOver');
    if (btnHomeOver) {
      btnHomeOver.addEventListener('click', () => {
        this.closeModals();
        this.exitToHomepage();
      });
    }

    const btnNextMap = document.getElementById('btnNextMap');
    if (btnNextMap) {
      btnNextMap.addEventListener('click', () => {
        this.closeModals();
        const nextId = this.selectedMapId < 3 ? this.selectedMapId + 1 : 1;
        this.selectedMapId = nextId;
        this.startLevel(nextId);
      });
    }

    const btnHomeVictory = document.getElementById('btnHomeVictory');
    if (btnHomeVictory) {
      btnHomeVictory.addEventListener('click', () => {
        this.closeModals();
        this.exitToHomepage();
      });
    }

    // Responsive Canvas
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  updateAudioButton() {
    const icon = document.getElementById('audioIcon');
    if (icon) {
      icon.textContent = this.sound.muted ? '🔇' : '🔊';
    }
  }

  renderHomepageSelection() {
    // Map selection buttons
    const mapButtons = document.querySelectorAll('.map-select-btn');
    mapButtons.forEach(btn => {
      const mapId = parseInt(btn.getAttribute('data-map'), 10);
      btn.classList.toggle('active', mapId === this.selectedMapId);
      btn.onclick = () => {
        this.selectedMapId = mapId;
        this.renderHomepageSelection();
      };
    });

    // Hunter count selection buttons
    const hunterButtons = document.querySelectorAll('.hunter-select-btn');
    hunterButtons.forEach(btn => {
      const count = parseInt(btn.getAttribute('data-count'), 10);
      btn.classList.toggle('active', count === this.hunterCount);
      btn.onclick = () => {
        this.hunterCount = count;
        this.renderHomepageSelection();
      };
    });

    // Difficulty buttons
    const diffButtons = document.querySelectorAll('.diff-select-btn');
    diffButtons.forEach(btn => {
      const diff = btn.getAttribute('data-diff');
      btn.classList.toggle('active', diff === this.difficulty);
    });

    // Active map preview label
    const mapPreviewTitle = document.getElementById('homeMapPreviewTitle');
    if (mapPreviewTitle) {
      const m = MAPS.find(x => x.id === this.selectedMapId) || MAPS[0];
      mapPreviewTitle.textContent = `${m.name} (${m.subtitle})`;
    }
  }

  renderRecordsTable() {
    const tbody = document.getElementById('recordsTableBody');
    if (!tbody) return;

    tbody.innerHTML = MAPS.map(m => {
      const rec = this.highScores[`map_${m.id}`];
      if (rec) {
        return `
          <tr>
            <td><strong>${m.name}</strong></td>
            <td>${this.formatTime(rec.timeMs)}</td>
            <td>${rec.steps} steps</td>
            <td>${rec.hunters} Hunters</td>
            <td>${rec.relics ? `${rec.relics} 💎` : 'Full'}</td>
            <td>${rec.date}</td>
          </tr>
        `;
      }
      return `
        <tr>
          <td><strong>${m.name}</strong></td>
          <td style="color: #94A3B8;">--:--.--</td>
          <td style="color: #94A3B8;">--</td>
          <td style="color: #94A3B8;">--</td>
          <td style="color: #94A3B8;">--</td>
          <td style="color: #94A3B8;">No Run Yet</td>
        </tr>
      `;
    }).join('');
  }

  exitToHomepage() {
    this.gameState = 'HOMEPAGE';
    this.closeModals();
    document.getElementById('homepageView').style.display = 'flex';
    document.getElementById('gameplayView').style.display = 'none';
    this.renderHomepageSelection();
    this.renderRecordsTable();
  }

  /**
   * Starts or restarts a level.
   * Generates a 23x23 procedural map with a random ending point and distinct blocks!
   */
  startLevel(mapId) {
    this.selectedMapId = mapId;

    // 1. Generate an expanded 23x23 procedural map with random goal node!
    this.currentMap = generateProceduralMap(mapId);
    this.gameState = 'PLAYING';
    this.closeModals();

    // Show Gameplay View, hide Homepage
    document.getElementById('homepageView').style.display = 'none';
    document.getElementById('gameplayView').style.display = 'grid';

    // 2. Reset Player to Start [1, 1]
    this.player.reset(this.currentMap.start.x, this.currentMap.start.y);

    // 3. Spawn AI Hunters according to selected count and difficulty multiplier
    this.hunters = [];
    const spawns = this.currentMap.hunterSpawns;

    let speedMultiplier = 1.0;
    if (this.difficulty === 'easy') speedMultiplier = 1.25;
    else if (this.difficulty === 'insane') speedMultiplier = 0.72;

    for (let i = 0; i < this.hunterCount; i++) {
      const profile = HUNTER_PROFILES[i % HUNTER_PROFILES.length];
      const spawnPos = spawns[i % spawns.length];
      const hunter = new Hunter(profile, spawnPos.x, spawnPos.y);
      hunter.interval = Math.round(profile.interval * speedMultiplier);
      hunter.baseInterval = hunter.interval;
      this.hunters.push(hunter);
    }

    // 4. Generate Random Map Objects (14 items distributed on 23x23 grid)
    this.mapObjects = generateRandomObjects(
      this.currentMap.grid,
      this.currentMap.width,
      this.currentMap.height,
      this.currentMap.start,
      this.currentMap.goal,
      this.currentMap.hunterSpawns
    );

    this.totalGems = this.mapObjects.filter(o => o.type === ObjectType.GEM).length;
    this.gemsCollected = 0;
    this.score = 0;

    // Reset Buffs
    this.speedTimer = 0;
    this.freezeTimer = 0;
    this.smokeTimer = 0;

    // Reset Metrics
    this.startTime = performance.now();
    this.elapsedTime = 0;
    this.particles = [];
    this.showToast(`🎲 23x23 Map Built · Exit Beacon: [${this.currentMap.goal.x}, ${this.currentMap.goal.y}]`, 2400);

    this.updateHUD();
    this.resizeCanvas();
  }

  showToast(text, duration = 2200) {
    this.hudToastText = text;
    this.hudToastTimer = duration;
    const banner = document.getElementById('hudToastBanner');
    if (banner) {
      banner.textContent = text;
      banner.style.opacity = '1';
      banner.style.transform = 'translateY(0)';
    }
  }

  checkObjectPickups() {
    for (const obj of this.mapObjects) {
      if (!obj.collected && obj.x === this.player.x && obj.y === this.player.y) {
        obj.collected = true;
        this.handleObjectCollect(obj);
        break;
      }
    }
  }

  handleObjectCollect(obj) {
    const info = obj.getInfo();

    switch (obj.type) {
      case ObjectType.GEM:
        this.gemsCollected++;
        this.score += 250;
        this.sound.gem();
        this.spawnParticles(obj.x, obj.y, info.color, 16);
        this.showToast(`💎 Collected Energy Relic (${this.gemsCollected}/${this.totalGems})! +250 Pts`, 1800);
        break;

      case ObjectType.SPEED:
        this.speedTimer = 6000;
        this.player.isSpeedBoosted = true;
        this.sound.powerup();
        this.spawnParticles(obj.x, obj.y, info.color, 24);
        this.showToast(`⚡ SPEED SURGE ACTIVATED! (6s)`, 2200);
        break;

      case ObjectType.FREEZE:
        this.freezeTimer = 4000;
        for (const h of this.hunters) {
          h.isFrozen = true;
        }
        this.sound.freezeChime();
        this.spawnParticles(obj.x, obj.y, info.color, 28);
        this.showToast(`❄️ CRYO PULSE: HUNTERS FROZEN! (4s)`, 2200);
        break;

      case ObjectType.SMOKE:
        this.smokeTimer = 5000;
        this.player.isInvisible = true;
        for (const h of this.hunters) {
          if (h.state === HunterState.CHASE) {
            h.state = HunterState.SEARCH;
            h.searchTimer = 2000;
          }
        }
        this.sound.powerup();
        this.spawnParticles(obj.x, obj.y, info.color, 24);
        this.showToast(`🌫️ SMOKE CLOAK ACTIVATED! Invisible for 5s`, 2200);
        break;

      case ObjectType.SHIELD:
        this.player.hasShield = true;
        this.sound.powerup();
        this.spawnParticles(obj.x, obj.y, info.color, 24);
        this.showToast(`🛡️ KINETIC SHIELD EQUIPPED! Absorbs 1 Hit`, 2200);
        break;
    }

    this.updateHUD();
  }

  togglePause() {
    if (this.gameState === 'PLAYING') {
      this.gameState = 'PAUSED';
      document.getElementById('pauseBtnLabel').textContent = '▶ Resume';
      document.getElementById('modalPause').classList.add('active');
    } else if (this.gameState === 'PAUSED') {
      this.gameState = 'PLAYING';
      this.startTime = performance.now() - this.elapsedTime;
      document.getElementById('pauseBtnLabel').textContent = '⏸ Pause';
      document.getElementById('modalPause').classList.remove('active');
    }
  }

  checkCollisions() {
    for (const h of this.hunters) {
      if (h.x === this.player.x && h.y === this.player.y) {
        if (this.player.hasShield) {
          this.player.hasShield = false;
          this.sound.shieldDeflect();
          this.spawnParticles(this.player.x, this.player.y, '#10B981', 35);

          h.x = h.spawnX;
          h.y = h.spawnY;
          h.visualX = h.spawnX;
          h.visualY = h.spawnY;
          h.state = HunterState.SEARCH;
          h.searchTimer = 2000;
          h.plannedPath = [];

          this.showToast(`🛡️ SHIELD DEFLECTED ATTACK! Hunter repelled!`, 2500);
          this.updateHUD();
          return;
        }

        this.handleGameOver(h.name);
        return;
      }
    }
  }

  checkVictory() {
    // Reached Randomly Placed Exit Goal
    if (this.player.x === this.currentMap.goal.x && this.player.y === this.currentMap.goal.y) {
      this.handleVictory();
    }
  }

  handleGameOver(hunterName) {
    this.gameState = 'GAME_OVER';
    this.sound.defeat();
    this.spawnParticles(this.player.x, this.player.y, '#DC2626', 35);

    const distToGoal = Math.round(Math.hypot(this.currentMap.goal.x - this.player.x, this.currentMap.goal.y - this.player.y));
    document.getElementById('overReason').textContent = `${hunterName} captured you! Exit beacon was ${distToGoal} tiles away at [${this.currentMap.goal.x}, ${this.currentMap.goal.y}].`;
    document.getElementById('overTime').textContent = this.formatTime(this.elapsedTime);
    document.getElementById('overSteps').textContent = this.player.steps;
    document.getElementById('overRelics').textContent = `${this.gemsCollected} / ${this.totalGems}`;
    document.getElementById('modalGameOver').classList.add('active');
  }

  handleVictory() {
    this.gameState = 'VICTORY';
    this.sound.victory();
    this.spawnParticles(this.currentMap.goal.x, this.currentMap.goal.y, '#16A34A', 45);

    const key = `map_${this.selectedMapId}`;
    const prev = this.highScores[key];
    let isRecord = false;
    if (!prev || this.elapsedTime < prev.timeMs) {
      isRecord = true;
      this.highScores[key] = {
        timeMs: this.elapsedTime,
        steps: this.player.steps,
        hunters: this.hunterCount,
        relics: this.gemsCollected,
        date: new Date().toLocaleDateString()
      };
      localStorage.setItem('maze_runner_records', JSON.stringify(this.highScores));
    }

    document.getElementById('vicMapTitle').textContent = `${this.currentMap.name} Cleared!`;
    const vicGoalSub = document.getElementById('vicGoalSub');
    if (vicGoalSub) {
      vicGoalSub.textContent = `You reached the random exit beacon at [${this.currentMap.goal.x}, ${this.currentMap.goal.y}] safely!`;
    }
    document.getElementById('vicTime').textContent = this.formatTime(this.elapsedTime);
    document.getElementById('vicSteps').textContent = this.player.steps;
    document.getElementById('vicHunters').textContent = this.hunterCount;
    document.getElementById('vicRelics').textContent = `${this.gemsCollected} / ${this.totalGems}`;
    document.getElementById('vicRecordStatus').textContent = isRecord ? '★ NEW RECORD!' : 'Completed';
    document.getElementById('modalVictory').classList.add('active');
  }

  closeModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
  }

  spawnParticles(x, y, color, count = 25) {
    const cellSize = this.canvas.width / (window.devicePixelRatio || 1) / this.currentMap.width;
    const px = (x + 0.5) * cellSize;
    const py = (y + 0.5) * cellSize;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 4.2;
      this.particles.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3,
        color,
        alpha: 1.0,
        decay: 0.02 + Math.random() * 0.03
      });
    }
  }

  updateHUD() {
    const hudMap = document.getElementById('hudMapName');
    if (hudMap) hudMap.textContent = this.currentMap.name;

    const hudSteps = document.getElementById('hudSteps');
    if (hudSteps) hudSteps.textContent = this.player.steps;

    const hudGems = document.getElementById('hudGemsCount');
    if (hudGems) hudGems.textContent = `${this.gemsCollected} / ${this.totalGems}`;

    // Live distance to random ending point
    const distToGoal = Math.round(Math.hypot(this.currentMap.goal.x - this.player.x, this.currentMap.goal.y - this.player.y));
    const hudGoalText = document.getElementById('hudGoalText');
    if (hudGoalText) {
      hudGoalText.textContent = `[${this.currentMap.goal.x}, ${this.currentMap.goal.y}] (${distToGoal} tiles)`;
    }

    const hudFooterGoal = document.getElementById('hudFooterGoal');
    if (hudFooterGoal) {
      hudFooterGoal.innerHTML = `Goal: Random Exit Node (<strong style="color: #16A34A">★</strong>) at <strong>[${this.currentMap.goal.x}, ${this.currentMap.goal.y}]</strong> · Dist: <strong>${distToGoal} tiles</strong>`;
    }

    // Render Active Buff Pills
    const buffContainer = document.getElementById('hudBuffsContainer');
    if (buffContainer) {
      const buffs = [];
      if (this.speedTimer > 0) {
        const sec = (this.speedTimer / 1000).toFixed(1);
        buffs.push(`<span class="buff-pill speed">⚡ Dash ${sec}s</span>`);
      }
      if (this.freezeTimer > 0) {
        const sec = (this.freezeTimer / 1000).toFixed(1);
        buffs.push(`<span class="buff-pill freeze">❄️ Freeze ${sec}s</span>`);
      }
      if (this.smokeTimer > 0) {
        const sec = (this.smokeTimer / 1000).toFixed(1);
        buffs.push(`<span class="buff-pill smoke">🌫️ Cloak ${sec}s</span>`);
      }
      if (this.player.hasShield) {
        buffs.push(`<span class="buff-pill shield">🛡️ Shield Active</span>`);
      }
      buffContainer.innerHTML = buffs.length > 0 ? buffs.join('') : '<span style="font-size: 0.75rem; color: #94A3B8;">No active buffs</span>';
    }

    // Render Hunter States in the sidebar
    const list = document.getElementById('hunterStatusList');
    if (list) {
      list.innerHTML = this.hunters.map(h => {
        let badgeColor = '#64748B';
        let badgeBg = '#F1F5F9';
        let statusText = 'Patrolling';

        if (h.isFrozen) {
          badgeColor = '#0891B2';
          badgeBg = '#CFFAFE';
          statusText = 'FROZEN ❄️';
        } else if (h.state === HunterState.CHASE) {
          badgeColor = '#DC2626';
          badgeBg = '#FEE2E2';
          statusText = 'CHASING!';
        } else if (h.state === HunterState.SEARCH) {
          badgeColor = '#D97706';
          badgeBg = '#FEF3C7';
          const sec = Math.ceil(h.searchTimer / 1000);
          statusText = `Searching (${sec}s)`;
        }

        const dist = Math.round(Math.hypot(h.x - this.player.x, h.y - this.player.y));

        return `
          <div class="hunter-status-card">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="hunter-dot" style="background: ${h.color};"></span>
              <span style="font-weight: 700; font-size: 0.8125rem;">${h.name}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 0.75rem; font-family: 'JetBrains Mono', monospace; color: #64748B;">${dist} tiles</span>
              <span class="hunter-state-tag" style="color: ${badgeColor}; background: ${badgeBg};">${statusText}</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  resizeCanvas() {
    const wrapper = this.canvas.parentElement;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const size = Math.floor(rect.width);

    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);
  }

  startLoop() {
    const loop = (timestamp) => {
      const dt = timestamp - this.lastFrameTime;
      this.lastFrameTime = timestamp;

      if (this.gameState === 'PLAYING') {
        this.elapsedTime = timestamp - this.startTime;
        const timeStr = this.formatTime(this.elapsedTime);
        const timerEl = document.getElementById('hudTimer');
        if (timerEl) timerEl.textContent = timeStr;

        // Buff countdown timers
        if (this.speedTimer > 0) {
          this.speedTimer -= dt;
          if (this.speedTimer <= 0) {
            this.speedTimer = 0;
            this.player.isSpeedBoosted = false;
          }
        }

        if (this.freezeTimer > 0) {
          this.freezeTimer -= dt;
          if (this.freezeTimer <= 0) {
            this.freezeTimer = 0;
            for (const h of this.hunters) {
              h.isFrozen = false;
            }
          }
        }

        if (this.smokeTimer > 0) {
          this.smokeTimer -= dt;
          if (this.smokeTimer <= 0) {
            this.smokeTimer = 0;
            this.player.isInvisible = false;
          }
        }

        // Toast fade
        if (this.hudToastTimer > 0) {
          this.hudToastTimer -= dt;
          if (this.hudToastTimer <= 0) {
            const banner = document.getElementById('hudToastBanner');
            if (banner) {
              banner.style.opacity = '0';
              banner.style.transform = 'translateY(-10px)';
            }
          }
        }

        // Update Hunters AI
        for (const h of this.hunters) {
          const prevState = h.state;
          h.update(timestamp, dt, this.player, this.currentMap.grid, this.currentMap.width, this.currentMap.height);

          if (prevState !== HunterState.CHASE && h.state === HunterState.CHASE && !h.isFrozen) {
            this.sound.alert();
          }

          h.updateVisual(0.35);
        }

        this.player.updateVisual(0.35);
        this.checkCollisions();
        this.updateHUD();
      }

      // Update Particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) this.particles.splice(i, 1);
      }

      if (this.gameState !== 'HOMEPAGE') {
        this.render(timestamp);
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  /**
   * Main Canvas Renderer with DISTINCT BLOCK & WALL FEEL per map theme!
   */
  render(timestamp = performance.now()) {
    const dpr = window.devicePixelRatio || 1;
    const width = this.canvas.width / dpr;
    const height = this.canvas.height / dpr;
    const ctx = this.ctx;
    const grid = this.currentMap.grid;
    const gridW = this.currentMap.width;
    const gridH = this.currentMap.height;
    const cellSize = width / gridW;
    const style = this.currentMap.style;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Themed Floor Background
    ctx.fillStyle = style.floorBase;
    ctx.fillRect(0, 0, width, height);

    // Subtle themed floor gridlines
    ctx.strokeStyle = style.floorGrid;
    ctx.lineWidth = 1;
    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        if (grid[y][x] === 0) {
          const fx = x * cellSize;
          const fy = y * cellSize;
          ctx.strokeRect(fx, fy, cellSize, cellSize);

          // Floor details per theme
          if (style.theme === 'emerald') {
            // Tiny jade corner dots on floors
            ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
            ctx.fillRect(fx + 2, fy + 2, 2, 2);
          } else if (style.theme === 'volcanic') {
            // Warm stone flag texture
            ctx.fillStyle = 'rgba(234, 88, 12, 0.05)';
            ctx.fillRect(fx + 3, fy + 3, cellSize - 6, cellSize - 6);
          }
        }
      }
    }

    // 2. Draw Hunter Planned Trails (during CHASE and SEARCH)
    for (const h of this.hunters) {
      h.drawTrail(ctx, cellSize);
    }

    // 3. Draw Maze Walls with DISTINCT THEMED BLOCK TEXTURES & ARCHITECTURE
    const isCourtyard = style.theme === 'courtyard';
    const isEmerald = style.theme === 'emerald';
    const isVolcanic = style.theme === 'volcanic';

    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        if (grid[y][x] === 1) {
          const wx = x * cellSize;
          const wy = y * cellSize;

          // A) Base Wall Block Fill
          ctx.fillStyle = style.wallBase;
          ctx.fillRect(wx, wy, cellSize, cellSize);

          // B) 3D Beveled Lighting Rims
          // Top & Left Highlight
          ctx.fillStyle = style.wallTop;
          ctx.fillRect(wx, wy, cellSize, 2);
          ctx.fillRect(wx, wy, 2, cellSize);

          // Bottom & Right Deep Shadow
          ctx.fillStyle = style.wallBottom;
          ctx.fillRect(wx, wy + cellSize - 2, cellSize, 2);
          ctx.fillRect(wx + cellSize - 2, wy, 2, cellSize);

          // C) DISTINCT ARCHITECTURAL BLOCK PATTERNS:
          if (isCourtyard) {
            // THEME 1: Sculpted Granite Masonry with brick joints & marble capping
            ctx.strokeStyle = style.wallBottom;
            ctx.lineWidth = 1;

            // Horizontal mortar joint across middle
            ctx.beginPath();
            ctx.moveTo(wx + 2, wy + cellSize * 0.5);
            ctx.lineTo(wx + cellSize - 2, wy + cellSize * 0.5);
            ctx.stroke();

            // Staggered vertical mortar joints
            ctx.beginPath();
            if ((y + x) % 2 === 0) {
              ctx.moveTo(wx + cellSize * 0.5, wy + 2);
              ctx.lineTo(wx + cellSize * 0.5, wy + cellSize * 0.5);
            } else {
              ctx.moveTo(wx + cellSize * 0.5, wy + cellSize * 0.5);
              ctx.lineTo(wx + cellSize * 0.5, wy + cellSize - 2);
            }
            ctx.stroke();

            // Limestone white cap accents
            ctx.fillStyle = '#CBD5E1';
            ctx.fillRect(wx + 2, wy + 2, 2.5, 2.5);
            ctx.fillRect(wx + cellSize - 4.5, wy + 2, 2.5, 2.5);

          } else if (isEmerald) {
            // THEME 2: Deep Jade Crystal Monoliths with Glowing Jewel Insets
            // Inset chiseled crystal diamond
            const midBlockX = wx + cellSize * 0.5;
            const midBlockY = wy + cellSize * 0.5;
            const diaW = cellSize * 0.28;
            const diaH = cellSize * 0.28;

            ctx.beginPath();
            ctx.moveTo(midBlockX, midBlockY - diaH);
            ctx.lineTo(midBlockX + diaW, midBlockY);
            ctx.lineTo(midBlockX, midBlockY + diaH);
            ctx.lineTo(midBlockX - diaW, midBlockY);
            ctx.closePath();
            ctx.fillStyle = '#059669';
            ctx.fill();
            ctx.strokeStyle = '#34D399';
            ctx.lineWidth = 1.2;
            ctx.stroke();

            // Specular crystal gleam
            ctx.fillStyle = '#A7F3D0';
            ctx.fillRect(midBlockX - 1, midBlockY - 1, 2, 2);

          } else if (isVolcanic) {
            // THEME 3: Molten Basalt with Glowing Magma Veins & Steel Rivets
            // Burning orange magma vein seam
            ctx.strokeStyle = '#EA580C';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(wx + 3, wy + cellSize * 0.35);
            ctx.lineTo(wx + cellSize * 0.55, wy + cellSize * 0.65);
            ctx.lineTo(wx + cellSize - 3, wy + cellSize * 0.4);
            ctx.stroke();

            // Magma fissure glow
            ctx.fillStyle = '#F59E0B';
            ctx.fillRect(wx + cellSize * 0.55 - 1, wy + cellSize * 0.65 - 1, 2, 2);

            // 4 Reinforced industrial corner rivets
            ctx.fillStyle = '#D97706';
            const rSize = 1.8;
            ctx.beginPath();
            ctx.arc(wx + 3.5, wy + 3.5, rSize, 0, Math.PI * 2);
            ctx.arc(wx + cellSize - 3.5, wy + 3.5, rSize, 0, Math.PI * 2);
            ctx.arc(wx + 3.5, wy + cellSize - 3.5, rSize, 0, Math.PI * 2);
            ctx.arc(wx + cellSize - 3.5, wy + cellSize - 3.5, rSize, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // 4. Draw Random Map Objects (Gems, Speed, Freeze, Smoke, Shield)
    for (const obj of this.mapObjects) {
      obj.draw(ctx, cellSize, timestamp);
    }

    // 5. Draw RANDOMLY PLACED Goal Ending Point Beacon (★)
    const goalX = (this.currentMap.goal.x + 0.5) * cellSize;
    const goalY = (this.currentMap.goal.y + 0.5) * cellSize;
    const pulse = 0.5 + 0.5 * Math.sin(timestamp * 0.005);

    ctx.save();
    // Expanding multi-tier radar beacon rings
    ctx.beginPath();
    ctx.arc(goalX, goalY, cellSize * (0.45 + pulse * 0.35), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(22, 163, 74, ${0.12 + pulse * 0.18})`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(goalX, goalY, cellSize * (0.85 + pulse * 0.55), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(34, 197, 94, ${0.28 * (1 - pulse)})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Solid emerald node box
    ctx.fillStyle = '#16A34A';
    const boxSize = cellSize * 0.72;
    ctx.beginPath();
    ctx.roundRect(goalX - boxSize / 2, goalY - boxSize / 2, boxSize, boxSize, 4);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Star icon inside exit beacon
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.floor(cellSize * 0.44)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', goalX, goalY + 1);
    ctx.restore();

    // 6. Draw Player Entity
    this.player.draw(ctx, cellSize);

    // 7. Draw Hunters with Facing Direction Indicators
    for (const h of this.hunters) {
      h.draw(ctx, cellSize);
    }

    // 8. Draw Active Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  formatTime(ms) {
    if (!ms || isNaN(ms)) return '00:00.00';
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
  }
}

// Instantiate engine when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.gameEngine = new GameEngine();
});
