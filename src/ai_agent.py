from collections import deque


def get_next_enemy_move(maze, enemy_pos, player_pos):
    """Return the first step on a shortest path from enemy to player."""
    rows = len(maze)
    if rows == 0:
        return enemy_pos

    cols = len(maze[0])
    start = tuple(enemy_pos)
    goal = tuple(player_pos)

    def is_open(position):
        row, col = position
        return (
            0 <= row < rows
            and 0 <= col < cols
            and len(maze[row]) == cols
            and maze[row][col] == 0
        )

    if not is_open(start) or not is_open(goal) or start == goal:
        return start

    queue = deque([start])
    parents = {start: None}
    directions = ((-1, 0), (1, 0), (0, -1), (0, 1))

    while queue:
        row, col = queue.popleft()
        if (row, col) == goal:
            break

        for row_step, col_step in directions:
            neighbor = (row + row_step, col + col_step)
            if neighbor not in parents and is_open(neighbor):
                parents[neighbor] = (row, col)
                queue.append(neighbor)

    if goal not in parents:
        return start

    step = goal
    while parents[step] != start:
        step = parents[step]
    return step