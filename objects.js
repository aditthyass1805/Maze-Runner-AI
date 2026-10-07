/**
 * objects.js
 * Random Map Objects & Power-Ups System for Maze Runner 2D
 * 
 * OBJECT TYPES:
 * - GEM (💎 Energy Relic): Collectible crystals scattered in the maze for score bonus & completion stats.
 * - SPEED (⚡ Speed Surge): Turbo dash sprint granting 1.8x player speed for 6 seconds.
 * - FREEZE (❄️ Cryo Pulse): Flash-freezes all AI hunters in place for 4 seconds.
 * - SMOKE (🌫️ Smoke Cloak): Cloaks the player in thick vapor, breaking Line-of-Sight and granting 5s invisibility.
 * - SHIELD (🛡️ Kinetic Shield): Absorbs 1 hunter capture collision, knocks hunter back to spawn, and spares player.
 */

export const ObjectType = {
  GEM: 'GEM',
  SPEED: 'SPEED',
  FREEZE: 'FREEZE',
  SMOKE: 'SMOKE',
  SHIELD: 'SHIELD'
};

export class MapObject {
  constructor(id, type, x, y) {
    this.id = id;
    this.type = type;
    this.x = x;
    this.y = y;
    this.collected = false;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.rotation = 0;
  }

  getInfo() {
    switch (this.type) {
      case ObjectType.GEM:
        return {
          name: 'Energy Relic',
          symbol: '💎',
          color: '#0284C7',
          glow: 'rgba(2, 132, 199, 0.4)',
          desc: '+250 Pts & Time Bonus'
        };
      case ObjectType.SPEED:
        return {
          name: 'Speed Surge',
          symbol: '⚡',
          color: '#D97706',
          glow: 'rgba(217, 119, 6, 0.45)',
          desc: '1.8x Dash Speed (6s)'
        };
      case ObjectType.FREEZE:
        return {
          name: 'Cryo Pulse',
          symbol: '❄️',
          color: '#0284C7',
          glow: 'rgba(6, 182, 212, 0.45)',
          desc: 'Freezes All Hunters (4s)'
        };
      case ObjectType.SMOKE:
        return {
          name: 'Smoke Cloak',
          symbol: '🌫️',
          color: '#9333EA',
          glow: 'rgba(147, 51, 234, 0.45)',
          desc: 'Invisible to Hunter LoS (5s)'
        };
      case ObjectType.SHIELD:
        return {
          name: 'Kinetic Shield',
          symbol: '🛡️',
          color: '#16A34A',
          glow: 'rgba(22, 163, 74, 0.45)',
          desc: 'Absorbs 1 Hunter Hit'
        };
      default:
        return {
          name: 'Artifact',
          symbol: '✨',
          color: '#64748B',
          glow: 'rgba(100, 116, 139, 0.3)',
          desc: 'Mystery Object'
        };
    }
  }

  draw(ctx, cellSize, now) {
    if (this.collected) return;

    const info = this.getInfo();
    const bob = Math.sin((now / 280) + this.pulsePhase) * (cellSize * 0.08);
    const pulse = 0.5 + 0.5 * Math.sin((now / 350) + this.pulsePhase);
    const cx = (this.x + 0.5) * cellSize;
    const cy = (this.y + 0.5) * cellSize + bob;
    const radius = cellSize * 0.34;

    ctx.save();

    // 1. Ground shadow underneath floating object
    const shadowSize = cellSize * 0.22 * (1 - (bob / cellSize) * 0.5);
    ctx.beginPath();
    ctx.ellipse((this.x + 0.5) * cellSize, (this.y + 0.78) * cellSize, shadowSize, shadowSize * 0.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.12)';
    ctx.fill();

    // 2. Ambient radial glow halo
    ctx.shadowColor = info.glow;
    ctx.shadowBlur = 8 + pulse * 6;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * (0.95 + pulse * 0.15), 0, Math.PI * 2);
    ctx.fillStyle = info.glow;
    ctx.fill();
    ctx.shadowBlur = 0;

    // 3. Object badge pedestal
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.82, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = info.color;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // 4. Vector glyph or symbol
    if (this.type === ObjectType.GEM) {
      // Crisp diamond gem graphic
      ctx.save();
      ctx.translate(cx, cy);
      const s = cellSize * 0.22;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.85, 0);
      ctx.lineTo(0, s);
      ctx.lineTo(-s * 0.85, 0);
      ctx.closePath();
      ctx.fillStyle = info.color;
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Gem facet highlight
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.7);
      ctx.lineTo(s * 0.45, 0);
      ctx.lineTo(0, s * 0.7);
      ctx.lineTo(-s * 0.45, 0);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fill();
      ctx.restore();
    } else {
      // Crisp icon rendering
      ctx.font = `${Math.floor(cellSize * 0.42)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(info.symbol, cx, cy + 1);
    }

    ctx.restore();
  }
}

/**
 * Procedurally generates random objects and scatters them across valid walkable tiles.
 * 
 * @param {number[][]} grid - 2D maze matrix
 * @param {number} width - Map width
 * @param {number} height - Map height
 * @param {{x: number, y: number}} start - Player start coordinates
 * @param {{x: number, y: number}} goal - Exit goal coordinates
 * @param {{x: number, y: number}[]} hunterSpawns - AI spawn coordinates
 * @returns {MapObject[]} Array of spawned random objects
 */
export function generateRandomObjects(grid, width, height, start, goal, hunterSpawns = []) {
  const walkable = [];
  const occupied = new Set();

  // Exclude start, goal and hunter spawn areas
  occupied.add(`${start.x},${start.y}`);
  occupied.add(`${goal.x},${goal.y}`);
  
  // Also exclude 1 tile radius around start to prevent instant spawn-pickup
  occupied.add(`${start.x + 1},${start.y}`);
  occupied.add(`${start.x},${start.y + 1}`);

  for (const s of hunterSpawns) {
    occupied.add(`${s.x},${s.y}`);
  }

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (grid[y] && grid[y][x] === 0) {
        const key = `${x},${y}`;
        if (!occupied.has(key)) {
          walkable.push({ x, y });
        }
      }
    }
  }

  // Fisher-Yates shuffle
  for (let i = walkable.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [walkable[i], walkable[j]] = [walkable[j], walkable[i]];
  }

  const objects = [];
  let idCounter = 1;

  // Object distribution recipe for expanded 23x23 map:
  // 6 Gems, 2 Speed, 2 Freeze, 2 Smoke, 2 Shield (Total 14 random objects)
  const typesToSpawn = [
    ObjectType.GEM,
    ObjectType.GEM,
    ObjectType.GEM,
    ObjectType.GEM,
    ObjectType.GEM,
    ObjectType.GEM,
    ObjectType.SPEED,
    ObjectType.SPEED,
    ObjectType.FREEZE,
    ObjectType.FREEZE,
    ObjectType.SMOKE,
    ObjectType.SMOKE,
    ObjectType.SHIELD,
    ObjectType.SHIELD
  ];

  for (let i = 0; i < typesToSpawn.length && i < walkable.length; i++) {
    const pos = walkable[i];
    objects.push(new MapObject(idCounter++, typesToSpawn[i], pos.x, pos.y));
  }

  return objects;
}
