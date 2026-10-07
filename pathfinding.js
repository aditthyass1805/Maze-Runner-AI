/**
 * pathfinding.js
 * Line-of-Sight (LoS) Raycasting & A* Pathfinding Module
 */

/**
 * Line-of-Sight (LoS) Raycast Check
 * Uses Bresenham's raycasting algorithm to check if hunter has an unobstructed view of the player.
 * A hunter sees the player ONLY if:
 * 1) Distance is within 6 tiles.
 * 2) No wall tiles (value 1) block the line between the hunter and player.
 * 
 * @param {{x: number, y: number}} hunter
 * @param {{x: number, y: number}} player
 * @param {number[][]} grid
 * @returns {boolean}
 */
export function hasLineOfSight(hunter, player, grid) {
  if (!hunter || !player || !grid) return false;

  const dx = player.x - hunter.x;
  const dy = player.y - hunter.y;
  const dist = Math.hypot(dx, dy);

  // Maximum visual range is strictly 6 tiles
  if (dist > 6) {
    return false;
  }

  let x0 = Math.round(hunter.x);
  let y0 = Math.round(hunter.y);
  const x1 = Math.round(player.x);
  const y1 = Math.round(player.y);

  if (x0 === x1 && y0 === y1) {
    return true;
  }

  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  const absDx = Math.abs(x1 - x0);
  const absDy = Math.abs(y1 - y0);
  let err = absDx - absDy;

  while (x0 !== x1 || y0 !== y1) {
    const e2 = 2 * err;
    if (e2 > -absDy) {
      err -= absDy;
      x0 += sx;
    }
    if (e2 < absDx) {
      err += absDx;
      y0 += sy;
    }

    // Reached player tile without hitting a wall
    if (x0 === x1 && y0 === y1) {
      return true;
    }

    // Check intermediate tile for wall obstruction
    if (!grid[y0] || grid[y0][x0] === 1) {
      return false;
    }
  }

  return true;
}

/**
 * A* Pathfinding Algorithm
 * Finds the shortest Manhattan path on a 4-connected grid.
 * 
 * @param {number[][]} grid - 2D grid matrix (0 = open, 1 = wall)
 * @param {number} width - Grid width
 * @param {number} height - Grid height
 * @param {{x: number, y: number}} start - Starting coordinate
 * @param {{x: number, y: number}} goal - Target coordinate
 * @returns {{x: number, y: number}[]} Array of coordinates from start to goal
 */
export function aStar(grid, width, height, start, goal) {
  if (!grid || !start || !goal) return [];

  const sX = Math.round(start.x);
  const sY = Math.round(start.y);
  const gX = Math.round(goal.x);
  const gY = Math.round(goal.y);

  if (sX === gX && sY === gY) {
    return [{ x: sX, y: sY }];
  }

  const key = (x, y) => `${x},${y}`;
  const startKey = key(sX, sY);
  const goalKey = key(gX, gY);

  const openSet = [{
    x: sX,
    y: sY,
    g: 0,
    f: Math.abs(sX - gX) + Math.abs(sY - gY)
  }];

  const cameFrom = new Map();
  const gScore = new Map();
  gScore.set(startKey, 0);

  const closedSet = new Set();

  while (openSet.length > 0) {
    // Pick node with lowest f-score
    let bestIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[bestIdx].f) {
        bestIdx = i;
      }
    }

    const current = openSet.splice(bestIdx, 1)[0];
    const currKey = key(current.x, current.y);

    if (current.x === gX && current.y === gY) {
      // Reconstruct path from goal back to start
      const path = [];
      let stepKey = goalKey;
      while (cameFrom.has(stepKey)) {
        const step = cameFrom.get(stepKey);
        path.unshift({ x: step.x, y: step.y });
        stepKey = key(step.fromX, step.fromY);
      }
      path.push({ x: gX, y: gY });
      return path;
    }

    closedSet.add(currKey);

    const neighbors = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 }
    ];

    for (const n of neighbors) {
      const nx = current.x + n.dx;
      const ny = current.y + n.dy;

      // Bounds & wall check
      if (nx < 0 || nx >= width || ny < 0 || ny >= height || !grid[ny] || grid[ny][nx] === 1) {
        continue;
      }

      const neighborKey = key(nx, ny);
      if (closedSet.has(neighborKey)) continue;

      const tentativeG = current.g + 1;
      const existingG = gScore.has(neighborKey) ? gScore.get(neighborKey) : Infinity;

      if (tentativeG < existingG) {
        cameFrom.set(neighborKey, { x: nx, y: ny, fromX: current.x, fromY: current.y });
        gScore.set(neighborKey, tentativeG);
        const h = Math.abs(nx - gX) + Math.abs(ny - gY);
        const f = tentativeG + h;

        const openNode = openSet.find(node => node.x === nx && node.y === ny);
        if (openNode) {
          openNode.g = tentativeG;
          openNode.f = f;
        } else {
          openSet.push({ x: nx, y: ny, g: tentativeG, f });
        }
      }
    }
  }

  return []; // No path found
}
