/**
 * maps.js
 * Procedural Map Generator System for Maze Runner 2D
 * 
 * FEATURES:
 * - High-scale expanded 23x23 maze dimension (over 2.3x larger than original 15x15).
 * - RANDOM ENDING POINT (Exit Beacon) placed dynamically on a distant, reachable open tile every playthrough.
 * - DISTINCT BLOCK & WALL ARCHITECTURAL FEEL per map:
 *   • The Grand Courtyard: Sculpted granite masonry brick blocks with marble corner capping & sunlit flagstone floor.
 *   • Emerald Labyrinth: Deep jade crystal monoliths with etched runic bevels, glowing core jewels & mint marble floor.
 *   • Volcanic Fortress: Molten basalt obsidian blocks with glowing lava magma grout seams, reinforced rivets & ash-ochre floor.
 * - Guaranteed BFS path connectivity and braided zero-dead-end escape loops on every generation.
 */

export const MAP_DIMENSION = 23; // Expanded 23x23 map size

export const THEME_STYLES = {
  courtyard: {
    theme: "courtyard",
    name: "Granite Masonry",
    wallBase: "#334155",
    wallTop: "#64748B",
    wallBottom: "#1E293B",
    wallTrim: "#94A3B8",
    wallPattern: "brick", // Masonry coursing joints
    floorBase: "#FFFFFF",
    floorGrid: "#E2E8F0",
    floorAccent: "#F8FAFC",
    accentColor: "#0284C7",
    glowColor: "rgba(2, 132, 199, 0.4)"
  },
  emerald: {
    theme: "emerald",
    name: "Jade Crystal",
    wallBase: "#064E3B",
    wallTop: "#059669",
    wallBottom: "#022C22",
    wallTrim: "#10B981",
    wallPattern: "crystal", // Glowing diamond crystal insets & chiseled bevels
    floorBase: "#F0FDF4",
    floorGrid: "#BBF7D0",
    floorAccent: "#DCFCE7",
    accentColor: "#10B981",
    glowColor: "rgba(16, 185, 129, 0.45)"
  },
  volcanic: {
    theme: "volcanic",
    name: "Molten Basalt",
    wallBase: "#0F172A",
    wallTop: "#DC2626",
    wallBottom: "#020617",
    wallTrim: "#EA580C",
    wallPattern: "magma", // Molten magma veins & reinforced metallic corner rivets
    floorBase: "#FFFBEB",
    floorGrid: "#FDE68A",
    floorAccent: "#FEF3C7",
    accentColor: "#F59E0B",
    glowColor: "rgba(234, 88, 12, 0.5)"
  }
};

/**
 * Validates connectivity from start to goal using Breadth-First Search (BFS).
 */
export function isPathAvailable(grid, start, goal, width, height) {
  if (!grid[start.y] || grid[start.y][start.x] === 1 || !grid[goal.y] || grid[goal.y][goal.x] === 1) {
    return false;
  }

  const queue = [{ x: start.x, y: start.y }];
  const visited = new Set();
  visited.add(`${start.x},${start.y}`);

  const dirs = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 }
  ];

  while (queue.length > 0) {
    const { x, y } = queue.shift();
    if (x === goal.x && y === goal.y) return true;

    for (const d of dirs) {
      const nx = x + d.dx;
      const ny = y + d.dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && grid[ny] && grid[ny][nx] === 0) {
        const key = `${nx},${ny}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({ x: nx, y: ny });
        }
      }
    }
  }

  return false;
}

/**
 * Removes single-tile dead ends by "braiding" the maze (converting dead ends into loops).
 * Any cell with only 1 walkable neighbor will have a neighboring wall carved open.
 */
function braidDeadEnds(grid, width, height) {
  let changed = true;
  let passes = 0;

  while (changed && passes < 16) {
    changed = false;
    passes++;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (grid[y][x] === 0) {
          const openNeighbors = [];
          const wallNeighbors = [];

          const candidates = [
            { x: x + 1, y: y },
            { x: x - 1, y: y },
            { x: x, y: y + 1 },
            { x: x, y: y - 1 }
          ];

          for (const c of candidates) {
            if (c.x > 0 && c.x < width - 1 && c.y > 0 && c.y < height - 1) {
              if (grid[c.y][c.x] === 0) {
                openNeighbors.push(c);
              } else {
                wallNeighbors.push(c);
              }
            }
          }

          // If dead-end (only 1 open neighbor), carve through an adjacent wall to form a loop!
          if (openNeighbors.length <= 1 && wallNeighbors.length > 0) {
            const pick = wallNeighbors[Math.floor(Math.random() * wallNeighbors.length)];
            grid[pick.y][pick.x] = 0;
            changed = true;
          }
        }
      }
    }
  }
}

/**
 * Places the Ending Goal Point RANDOMLY on a distant, reachable walkable tile.
 * Distance from start [1, 1] must be at least 15 tiles away to ensure an epic trek.
 */
function pickRandomGoal(grid, width, height, start) {
  const candidates = [];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (grid[y] && grid[y][x] === 0) {
        const dist = Math.hypot(x - start.x, y - start.y);
        // Minimum distance: ~65% of map width (at least 15 tiles away for 23x23)
        if (dist >= width * 0.65) {
          candidates.push({ x, y, dist });
        }
      }
    }
  }

  // Filter candidates that are proven reachable via BFS from start
  const reachableCandidates = candidates.filter(c => isPathAvailable(grid, start, c, width, height));

  if (reachableCandidates.length > 0) {
    // Sort descending by distance and pick randomly from the top 50% farthest
    reachableCandidates.sort((a, b) => b.dist - a.dist);
    const poolSize = Math.max(4, Math.floor(reachableCandidates.length * 0.5));
    const chosen = reachableCandidates[Math.floor(Math.random() * poolSize)];
    return { x: chosen.x, y: chosen.y };
  }

  // Fallback to opposite corner if candidate pool empty
  const fallback = { x: width - 2, y: height - 2 };
  grid[fallback.y][fallback.x] = 0;
  return fallback;
}

/**
 * Finds 5 well-separated safe hunter spawn coordinates far from player start [1, 1].
 */
function calculateHunterSpawns(grid, width, height, start, goal) {
  const candidates = [];

  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      if (grid[y][x] === 0) {
        const distToStart = Math.hypot(x - start.x, y - start.y);
        const distToGoal = Math.hypot(x - goal.x, y - goal.y);
        // At least 10 Euclidean distance from start, and not right on the goal
        if (distToStart >= 10.0 && distToGoal >= 3.5) {
          candidates.push({ x, y, dist: distToStart });
        }
      }
    }
  }

  // Shuffle candidates
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  // Pick diverse positions across distinct quadrants
  const spawns = [];
  const minSeparation = 4.5;

  for (const c of candidates) {
    let tooClose = false;
    for (const s of spawns) {
      if (Math.hypot(c.x - s.x, c.y - s.y) < minSeparation) {
        tooClose = true;
        break;
      }
    }
    if (!tooClose) {
      spawns.push({ x: c.x, y: c.y });
      if (spawns.length >= 5) break;
    }
  }

  // Fallback if needed
  while (spawns.length < 5 && candidates.length > 0) {
    const next = candidates.pop();
    if (!spawns.some(s => s.x === next.x && s.y === next.y)) {
      spawns.push({ x: next.x, y: next.y });
    }
  }

  return spawns;
}

/**
 * Procedural Generator for Map 1: The Grand Courtyard (23x23)
 * Characteristics: Wide avenues, 7x7 central courtyard plaza, garden boulevards.
 */
function generateCourtyard(width, height) {
  const grid = Array.from({ length: height }, () => Array(width).fill(1));

  // Outer perimeter avenues (always open)
  for (let x = 1; x < width - 1; x++) {
    grid[1][x] = 0;
    grid[height - 2][x] = 0;
  }
  for (let y = 1; y < height - 1; y++) {
    grid[y][1] = 0;
    grid[y][width - 2] = 0;
  }

  // Central Grand Plaza: open 7x7 area in the middle
  const midX = Math.floor(width / 2);
  const midY = Math.floor(height / 2);
  for (let y = midY - 3; y <= midY + 3; y++) {
    for (let x = midX - 3; x <= midX + 3; x++) {
      grid[y][x] = 0;
    }
  }

  // Decorative courtyard garden pillars
  grid[midY - 2][midX - 2] = 1;
  grid[midY - 2][midX + 2] = 1;
  grid[midY + 2][midX - 2] = 1;
  grid[midY + 2][midX + 2] = 1;

  // Multiple cross avenues connecting perimeter to plaza
  const avenues = [3, 5, 8, 11, 14, 17, 19];
  for (const a of avenues) {
    if (a < width - 1) {
      for (let y = 1; y < height - 1; y++) {
        if (Math.random() > 0.35) grid[y][a] = 0;
      }
    }
    if (a < height - 1) {
      for (let x = 1; x < width - 1; x++) {
        if (Math.random() > 0.35) grid[a][x] = 0;
      }
    }
  }

  // Extra random open links for diverse routes
  for (let i = 0; i < 45; i++) {
    const rx = 1 + Math.floor(Math.random() * (width - 2));
    const ry = 1 + Math.floor(Math.random() * (height - 2));
    grid[ry][rx] = 0;
  }

  return grid;
}

/**
 * Procedural Generator for Map 2: Emerald Labyrinth (23x23)
 * Characteristics: Dense braided maze network with MULTIPLE escape loops and ZERO dead ends.
 */
function generateEmeraldLabyrinth(width, height) {
  const grid = Array.from({ length: height }, () => Array(width).fill(1));

  // 1. Grid of passages on odd coordinates
  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      grid[y][x] = 0;
    }
  }

  // 2. Candidate walls between odd nodes
  const walls = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if ((x % 2 === 0 && y % 2 === 1) || (x % 2 === 1 && y % 2 === 0)) {
        walls.push({ x, y });
      }
    }
  }

  // Shuffle walls
  for (let i = walls.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [walls[i], walls[j]] = [walls[j], walls[i]];
  }

  // Carve 72% of candidate walls to ensure rich interconnected loops
  for (const w of walls) {
    if (Math.random() > 0.28) {
      grid[w.y][w.x] = 0;
    }
  }

  // Open perimeter runways
  for (let x = 1; x < width - 1; x++) {
    grid[1][x] = 0;
    grid[height - 2][x] = 0;
  }
  for (let y = 1; y < height - 1; y++) {
    grid[y][1] = 0;
    grid[y][width - 2] = 0;
  }

  // Extra escape bypasses
  for (let i = 0; i < 50; i++) {
    const rx = 1 + Math.floor(Math.random() * (width - 2));
    const ry = 1 + Math.floor(Math.random() * (height - 2));
    grid[ry][rx] = 0;
  }

  return grid;
}

/**
 * Procedural Generator for Map 3: Volcanic Fortress (23x23)
 * Characteristics: Wide 2-tile chambers, outer ring & concentric inner ring avenues.
 */
function generateVolcanicFortress(width, height) {
  const grid = Array.from({ length: height }, () => Array(width).fill(1));

  // 1. Wide 2-tile outer ring
  for (let x = 1; x < width - 1; x++) {
    grid[1][x] = 0;
    grid[2][x] = 0;
    grid[height - 3][x] = 0;
    grid[height - 2][x] = 0;
  }
  for (let y = 1; y < height - 1; y++) {
    grid[y][1] = 0;
    grid[y][2] = 0;
    grid[y][width - 3] = 0;
    grid[y][width - 2] = 0;
  }

  // 2. Wide middle ring (x: 6..7, x: 15..16, y: 6..7, y: 15..16)
  for (let x = 5; x <= 17; x++) {
    grid[5][x] = 0;
    grid[6][x] = 0;
    grid[16][x] = 0;
    grid[17][x] = 0;
  }
  for (let y = 5; y <= 17; y++) {
    grid[y][5] = 0;
    grid[y][6] = 0;
    grid[y][16] = 0;
    grid[y][17] = 0;
  }

  // 3. Central Keep Bastion (open 5x5 chamber)
  const midX = Math.floor(width / 2);
  const midY = Math.floor(height / 2);
  for (let y = midY - 2; y <= midY + 2; y++) {
    for (let x = midX - 2; x <= midX + 2; x++) {
      grid[y][x] = 0;
    }
  }

  // 4. Multiple 2-tile wide radial connecting gates
  const gates = [
    { x1: 2, x2: 6, y: midY - 1 },
    { x1: 2, x2: 6, y: midY },
    { x1: 16, x2: width - 3, y: midY - 1 },
    { x1: 16, x2: width - 3, y: midY },
    { y1: 2, y2: 6, x: midX - 1 },
    { y1: 2, y2: 6, x: midX },
    { y1: 16, y2: height - 3, x: midX - 1 },
    { y1: 16, y2: height - 3, x: midX }
  ];

  for (const g of gates) {
    if (g.x1 !== undefined) {
      for (let x = g.x1; x <= g.x2; x++) grid[g.y][x] = 0;
    } else {
      for (let y = g.y1; y <= g.y2; y++) grid[y][g.x] = 0;
    }
  }

  // Extra random open links
  for (let i = 0; i < 40; i++) {
    const rx = 2 + Math.floor(Math.random() * (width - 4));
    const ry = 2 + Math.floor(Math.random() * (height - 4));
    grid[ry][rx] = 0;
  }

  return grid;
}

/**
 * Main Procedural Map Generator
 * Generates an expanded 23x23 maze with a RANDOMLY PLACED ending point and unique block aesthetics.
 * 
 * @param {number} mapId - 1, 2, or 3
 * @param {number} [width=23] - Grid width (default 23)
 * @param {number} [height=23] - Grid height (default 23)
 * @returns {object} Full Map object with random goal, distinct block styles, and guaranteed solvability.
 */
export function generateProceduralMap(mapId = 1, width = MAP_DIMENSION, height = MAP_DIMENSION) {
  const start = { x: 1, y: 1 };
  let grid;
  let attempts = 0;
  let goal;

  const styleKey = mapId === 1 ? 'courtyard' : mapId === 2 ? 'emerald' : 'volcanic';
  const style = THEME_STYLES[styleKey] || THEME_STYLES.courtyard;

  do {
    attempts++;
    if (mapId === 1) {
      grid = generateCourtyard(width, height);
    } else if (mapId === 2) {
      grid = generateEmeraldLabyrinth(width, height);
    } else {
      grid = generateVolcanicFortress(width, height);
    }

    // Always clear start cell and runway
    grid[start.y][start.x] = 0;
    grid[start.y + 1][start.x] = 0;
    grid[start.y][start.x + 1] = 0;

    // Enforce border walls
    for (let x = 0; x < width; x++) {
      grid[0][x] = 1;
      grid[height - 1][x] = 1;
    }
    for (let y = 0; y < height; y++) {
      grid[y][0] = 1;
      grid[y][width - 1] = 1;
    }

    // Eliminate single-tile dead ends / entrapment holes
    braidDeadEnds(grid, width, height);

    // Pick a completely RANDOM ENDING POINT distant from start!
    goal = pickRandomGoal(grid, width, height, start);

  } while (!isPathAvailable(grid, start, goal, width, height) && attempts < 10);

  // If after 10 attempts still not connected (rare edge case), carve a guaranteed clear runway to goal
  if (!isPathAvailable(grid, start, goal, width, height)) {
    let curX = start.x;
    let curY = start.y;
    while (curX !== goal.x) {
      curX += curX < goal.x ? 1 : -1;
      grid[curY][curX] = 0;
    }
    while (curY !== goal.y) {
      curY += curY < goal.y ? 1 : -1;
      grid[curY][curX] = 0;
    }
  }

  // Ensure surroundings of goal node are clear
  grid[goal.y][goal.x] = 0;
  if (goal.x > 1) grid[goal.y][goal.x - 1] = 0;
  if (goal.x < width - 2) grid[goal.y][goal.x + 1] = 0;

  // Calculate dynamic, fair hunter spawns
  const hunterSpawns = calculateHunterSpawns(grid, width, height, start, goal);

  const titles = {
    1: {
      name: "The Grand Courtyard",
      subtitle: "Expanded 23x23 · Granite Masonry · Random Exit",
      theme: "courtyard"
    },
    2: {
      name: "Emerald Labyrinth",
      subtitle: "Expanded 23x23 · Jade Monoliths · Random Exit",
      theme: "emerald"
    },
    3: {
      name: "Volcanic Fortress",
      subtitle: "Expanded 23x23 · Molten Obsidian · Random Exit",
      theme: "volcanic"
    }
  };

  const info = titles[mapId] || titles[1];

  return {
    id: mapId,
    name: info.name,
    subtitle: info.subtitle,
    theme: info.theme,
    style,
    width,
    height,
    start,
    goal, // Randomly generated ending point
    hunterSpawns,
    grid,
    seed: Date.now() + Math.random()
  };
}

/**
 * Static baseline MAPS list.
 */
export const MAPS = [
  {
    id: 1,
    name: "The Grand Courtyard",
    subtitle: "Expanded 23x23 · Sculpted Granite Masonry · Random Exit",
    theme: "courtyard"
  },
  {
    id: 2,
    name: "Emerald Labyrinth",
    subtitle: "Expanded 23x23 · Jade Crystal Monoliths · Random Exit",
    theme: "emerald"
  },
  {
    id: 3,
    name: "Volcanic Fortress",
    subtitle: "Expanded 23x23 · Molten Obsidian Bastion · Random Exit",
    theme: "volcanic"
  }
];

export function getMap(id) {
  return generateProceduralMap(id);
}
