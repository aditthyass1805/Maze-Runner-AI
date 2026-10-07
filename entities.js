/**
 * entities.js
 * Game Entities: Player & Intelligent LoS Hunter AI with Power-Up Buff States
 */

import { aStar, hasLineOfSight } from './pathfinding.js';

export const HunterState = {
  PATROL: 'PATROL',
  CHASE: 'CHASE',
  SEARCH: 'SEARCH'
};

export const HUNTER_PROFILES = [
  { id: 0, name: 'Red Stalker', color: '#DC2626', glow: 'rgba(220, 38, 38, 0.45)', interval: 370 },
  { id: 1, name: 'Amber Hunter', color: '#D97706', glow: 'rgba(217, 119, 6, 0.45)', interval: 410 },
  { id: 2, name: 'Purple Specter', color: '#9333EA', glow: 'rgba(147, 51, 234, 0.45)', interval: 340 },
  { id: 3, name: 'Magenta Phantom', color: '#C026D3', glow: 'rgba(192, 38, 211, 0.45)', interval: 440 },
  { id: 4, name: 'Crimson Vanguard', color: '#991B1B', glow: 'rgba(153, 27, 27, 0.45)', interval: 390 }
];

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.visualX = x;
    this.visualY = y;
    this.facing = { dx: 1, dy: 0 };
    this.steps = 0;

    // Power-up Buff States
    this.hasShield = false;
    this.isInvisible = false;
    this.isSpeedBoosted = false;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.visualX = x;
    this.visualY = y;
    this.facing = { dx: 1, dy: 0 };
    this.steps = 0;
    this.hasShield = false;
    this.isInvisible = false;
    this.isSpeedBoosted = false;
  }

  move(dx, dy, grid, width, height) {
    const targetX = this.x + dx;
    const targetY = this.y + dy;

    // Boundary check
    if (targetX < 0 || targetX >= width || targetY < 0 || targetY >= height) {
      return false;
    }

    // Wall collision check
    if (!grid[targetY] || grid[targetY][targetX] === 1) {
      return false;
    }

    this.x = targetX;
    this.y = targetY;
    this.facing = { dx, dy };
    this.steps++;
    return true;
  }

  updateVisual(lerp = 0.35) {
    this.visualX += (this.x - this.visualX) * lerp;
    this.visualY += (this.y - this.visualY) * lerp;
  }

  draw(ctx, cellSize) {
    const px = (this.visualX + 0.5) * cellSize;
    const py = (this.visualY + 0.5) * cellSize;
    const radius = cellSize * 0.38;
    const now = performance.now();

    ctx.save();

    // Invisibility Smoke Cloak Effect
    if (this.isInvisible) {
      ctx.globalAlpha = 0.45;

      // Vapor cloud ring
      ctx.beginPath();
      ctx.arc(px, py, radius * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(147, 51, 234, 0.2)';
      ctx.fill();
    }

    // Speed Surge Dash Aura
    if (this.isSpeedBoosted) {
      const speedPulse = 0.5 + 0.5 * Math.sin(now * 0.012);
      ctx.shadowColor = '#D97706';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(px, py, radius * (1.15 + speedPulse * 0.2), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(217, 119, 6, 0.25)';
      ctx.fill();
    }

    // Ambient player glow
    ctx.shadowColor = 'rgba(2, 132, 199, 0.45)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#0284C7';
    ctx.fill();
    ctx.shadowBlur = 0;

    // Outer ring
    ctx.beginPath();
    ctx.arc(px, py, radius * 0.65, 0, Math.PI * 2);
    ctx.fillStyle = '#38BDF8';
    ctx.fill();

    // Directional facing indicator
    const eyeOffset = radius * 0.45;
    const eyeX = px + this.facing.dx * eyeOffset;
    const eyeY = py + this.facing.dy * eyeOffset;
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, radius * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // Kinetic Shield Orb Barrier
    if (this.hasShield) {
      const spinAngle = now * 0.003;
      ctx.shadowColor = '#10B981';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(px, py, radius * 1.35, 0, Math.PI * 2);
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Orbiting shield node
      const orbX = px + Math.cos(spinAngle) * (radius * 1.35);
      const orbY = py + Math.sin(spinAngle) * (radius * 1.35);
      ctx.beginPath();
      ctx.arc(orbX, orbY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#34D399';
      ctx.fill();
    }

    ctx.restore();
  }
}

export class Hunter {
  constructor(profile, startX, startY) {
    this.id = profile.id;
    this.name = profile.name;
    this.color = profile.color;
    this.glow = profile.glow;
    this.baseInterval = profile.interval;
    this.interval = profile.interval;

    this.spawnX = startX;
    this.spawnY = startY;
    this.x = startX;
    this.y = startY;
    this.visualX = startX;
    this.visualY = startY;

    // AI States: PATROL (Default) -> CHASE (LoS) -> SEARCH (Lost LoS) -> PATROL (Escaped)
    this.state = HunterState.PATROL;
    this.facing = { dx: 0, dy: 1 }; // Initial facing: Down
    this.lastSeenPosition = null;
    this.searchTimer = 0; // 2 seconds search window
    this.plannedPath = [];
    this.lastMoveTime = 0;

    // Cryo freeze state
    this.isFrozen = false;
  }

  reset(x, y) {
    this.spawnX = x;
    this.spawnY = y;
    this.x = x;
    this.y = y;
    this.visualX = x;
    this.visualY = y;
    this.state = HunterState.PATROL;
    this.facing = { dx: 0, dy: 1 };
    this.lastSeenPosition = null;
    this.searchTimer = 0;
    this.plannedPath = [];
    this.lastMoveTime = 0;
    this.isFrozen = false;
  }

  /**
   * Main AI Update Tick
   */
  update(now, dt, player, grid, width, height) {
    // 0. If hunter is frozen in ice, no movement or state changes!
    if (this.isFrozen) {
      return;
    }

    // 1. Raycast Line-of-Sight (LoS) check
    // If player is cloaked in Smoke, hunter CANNOT see player
    const seesPlayer = !player.isInvisible && hasLineOfSight({ x: this.x, y: this.y }, { x: player.x, y: player.y }, grid);

    // 2. State Machine Transitions
    if (seesPlayer) {
      // Direct visual contact! Engage CHASE mode
      this.state = HunterState.CHASE;
      this.lastSeenPosition = { x: player.x, y: player.y };
      this.searchTimer = 2000;
    } else if (this.state === HunterState.CHASE) {
      // Player broke line of sight (or popped smoke cloak)!
      this.state = HunterState.SEARCH;
      this.searchTimer = 2000;
    } else if (this.state === HunterState.SEARCH) {
      // Check if reached last seen position
      const reachedLastSeen = this.lastSeenPosition &&
        this.x === this.lastSeenPosition.x &&
        this.y === this.lastSeenPosition.y;

      if (reachedLastSeen) {
        // At the spot: countdown search timer
        this.searchTimer -= dt;
        if (this.searchTimer <= 0) {
          // Search expired without finding player: drop chase and resume patrol!
          this.state = HunterState.PATROL;
          this.lastSeenPosition = null;
          this.plannedPath = [];
        }
      }
    }

    // 3. Movement Step (throttled by interval)
    if (now - this.lastMoveTime >= this.interval) {
      this.lastMoveTime = now;

      if (this.state === HunterState.CHASE) {
        // Run A* directly to the visible player
        this.plannedPath = aStar(
          grid,
          width,
          height,
          { x: this.x, y: this.y },
          { x: player.x, y: player.y }
        );
        this.stepAlongPath();
      } else if (this.state === HunterState.SEARCH) {
        // Run A* to the last seen position
        if (this.lastSeenPosition && (this.x !== this.lastSeenPosition.x || this.y !== this.lastSeenPosition.y)) {
          this.plannedPath = aStar(
            grid,
            width,
            height,
            { x: this.x, y: this.y },
            this.lastSeenPosition
          );
          this.stepAlongPath();
        } else {
          // Searching at the spot: turn to scan around open passages
          this.plannedPath = [];
          this.scanAdjacent(grid, width, height);
        }
      } else {
        // PATROL State: DO NOT run A* to the player!
        // Wander along open corridors/intersections
        this.plannedPath = [];
        this.patrolWander(grid, width, height);
      }
    }
  }

  stepAlongPath() {
    if (this.plannedPath && this.plannedPath.length > 1) {
      const nextTile = this.plannedPath[1];
      const dx = nextTile.x - this.x;
      const dy = nextTile.y - this.y;
      if (dx !== 0 || dy !== 0) {
        this.facing = { dx, dy };
      }
      this.x = nextTile.x;
      this.y = nextTile.y;
    }
  }

  scanAdjacent(grid, width, height) {
    const openNeighbors = this.getOpenNeighbors(grid, width, height);
    if (openNeighbors.length > 0) {
      const randomDir = openNeighbors[Math.floor(Math.random() * openNeighbors.length)];
      this.facing = { dx: randomDir.x - this.x, dy: randomDir.y - this.y };
    }
  }

  /**
   * Natural Patrol Wandering
   * Explores open corridors and turns naturally at intersections without knowing player's location.
   */
  patrolWander(grid, width, height) {
    const openNeighbors = this.getOpenNeighbors(grid, width, height);
    if (openNeighbors.length === 0) return;

    // Filter out immediate reverse direction unless it's a dead end
    const reverseDx = -this.facing.dx;
    const reverseDy = -this.facing.dy;
    const forwardOptions = openNeighbors.filter(n => {
      const dx = n.x - this.x;
      const dy = n.y - this.y;
      return !(dx === reverseDx && dy === reverseDy);
    });

    const candidatePool = forwardOptions.length > 0 ? forwardOptions : openNeighbors;

    // Check if continuing straight in current facing direction is an option
    const straightOption = candidatePool.find(n => (n.x - this.x === this.facing.dx && n.y - this.y === this.facing.dy));

    let chosen;
    // 60% bias to continue straight along corridors; turns at intersections
    if (straightOption && Math.random() < 0.6) {
      chosen = straightOption;
    } else {
      chosen = candidatePool[Math.floor(Math.random() * candidatePool.length)];
    }

    const dx = chosen.x - this.x;
    const dy = chosen.y - this.y;
    if (dx !== 0 || dy !== 0) {
      this.facing = { dx, dy };
    }
    this.x = chosen.x;
    this.y = chosen.y;
  }

  getOpenNeighbors(grid, width, height) {
    const dirs = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 }
    ];
    const open = [];
    for (const d of dirs) {
      const nx = this.x + d.dx;
      const ny = this.y + d.dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && grid[ny] && grid[ny][nx] === 0) {
        open.push({ x: nx, y: ny });
      }
    }
    return open;
  }

  updateVisual(lerp = 0.35) {
    this.visualX += (this.x - this.visualX) * lerp;
    this.visualY += (this.y - this.visualY) * lerp;
  }

  /**
   * Render Hunter Entity & Distinct Directional Facing Indicator
   */
  draw(ctx, cellSize) {
    const px = (this.visualX + 0.5) * cellSize;
    const py = (this.visualY + 0.5) * cellSize;
    const radius = cellSize * 0.36;

    ctx.save();

    // 0. Cryo Frozen Ice Cube Visual
    if (this.isFrozen) {
      const iceSize = cellSize * 0.88;
      ctx.shadowColor = '#06B6D4';
      ctx.shadowBlur = 10;
      ctx.fillStyle = 'rgba(6, 182, 212, 0.35)';
      ctx.fillRect(px - iceSize / 2, py - iceSize / 2, iceSize, iceSize);
      ctx.strokeStyle = '#22D3EE';
      ctx.lineWidth = 1.8;
      ctx.strokeRect(px - iceSize / 2, py - iceSize / 2, iceSize, iceSize);

      ctx.fillStyle = '#0891B2';
      ctx.font = `bold ${Math.round(cellSize * 0.36)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('❄️', px, py);
      ctx.restore();
      return;
    }

    // 1. Alert Aura if in CHASE or SEARCH
    if (this.state === HunterState.CHASE) {
      ctx.shadowColor = this.glow;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(px, py, radius * 1.3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(220, 38, 38, 0.18)';
      ctx.fill();
    } else if (this.state === HunterState.SEARCH) {
      ctx.shadowColor = 'rgba(217, 119, 6, 0.4)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(px, py, radius * 1.15, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(217, 119, 6, 0.12)';
      ctx.fill();
    }

    // 2. Hunter Main Body Circle
    ctx.shadowColor = this.glow;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.shadowBlur = 0;

    // 3. Inner core
    ctx.beginPath();
    ctx.arc(px, py, radius * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(px, py, radius * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // 4. Distinct Facing Direction Indicator (Arrow / Pointer on Hunter's circle)
    const angle = Math.atan2(this.facing.dy, this.facing.dx);
    const tipDistance = radius * 1.15;
    const baseDistance = radius * 0.45;
    const tipX = px + Math.cos(angle) * tipDistance;
    const tipY = py + Math.sin(angle) * tipDistance;
    const leftX = px + Math.cos(angle + 2.3) * baseDistance;
    const leftY = py + Math.sin(angle + 2.3) * baseDistance;
    const rightX = px + Math.cos(angle - 2.3) * baseDistance;
    const rightY = py + Math.sin(angle - 2.3) * baseDistance;

    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(leftX, leftY);
    ctx.lineTo(rightX, rightY);
    ctx.closePath();
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 5. State Icon / Alert Floating Indicator
    if (this.state === HunterState.CHASE) {
      ctx.fillStyle = '#DC2626';
      ctx.font = `bold ${Math.round(cellSize * 0.35)}px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('!', px, py - radius - 2);
    } else if (this.state === HunterState.SEARCH) {
      ctx.fillStyle = '#D97706';
      ctx.font = `bold ${Math.round(cellSize * 0.32)}px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('?', px, py - radius - 2);
    }

    ctx.restore();
  }

  /**
   * Draw Planned A* Trail (Highlighted ONLY during CHASE and SEARCH)
   */
  drawTrail(ctx, cellSize) {
    if (this.isFrozen || this.state === HunterState.PATROL || !this.plannedPath || this.plannedPath.length <= 1) {
      return;
    }

    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.state === HunterState.CHASE ? 0.30 : 0.16;
    ctx.lineWidth = Math.max(2, cellSize * 0.2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    for (let i = 0; i < this.plannedPath.length; i++) {
      const pt = this.plannedPath[i];
      const cx = (pt.x + 0.5) * cellSize;
      const cy = (pt.y + 0.5) * cellSize;
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Draw waypoints
    ctx.globalAlpha = this.state === HunterState.CHASE ? 0.40 : 0.20;
    for (let i = 1; i < this.plannedPath.length - 1; i++) {
      const pt = this.plannedPath[i];
      ctx.beginPath();
      ctx.arc((pt.x + 0.5) * cellSize, (pt.y + 0.5) * cellSize, cellSize * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
