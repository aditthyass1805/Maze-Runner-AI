import pygame

from src.ai_agent import get_next_enemy_move
from src.config import (
    COLOR_BACKGROUND,
    COLOR_ENEMY,
    COLOR_GOAL,
    COLOR_GRID,
    COLOR_PATH,
    COLOR_PLAYER,
    COLOR_TEXT,
    COLOR_WALL,
    ENEMY_MOVE_INTERVAL,
    ENEMY_START_POS,
    FPS,
    GOAL_POS,
    HUD_HEIGHT,
    SCREEN_HEIGHT,
    SCREEN_WIDTH,
    STARTER_MAZE,
    START_POS,
    TILE_SIZE,
)


def main():
    pygame.init()
    screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
    pygame.display.set_caption("Maze Runner with AI Enemy")
    clock = pygame.time.Clock()
    font = pygame.font.Font(None, 28)

    player_pos = START_POS
    enemy_pos = ENEMY_START_POS
    game_state = "playing"
    last_enemy_move = pygame.time.get_ticks()

    movement_keys = {
        pygame.K_w: (-1, 0),
        pygame.K_UP: (-1, 0),
        pygame.K_s: (1, 0),
        pygame.K_DOWN: (1, 0),
        pygame.K_a: (0, -1),
        pygame.K_LEFT: (0, -1),
        pygame.K_d: (0, 1),
        pygame.K_RIGHT: (0, 1),
    }

    def draw():
        screen.fill(COLOR_BACKGROUND)

        for row, maze_row in enumerate(STARTER_MAZE):
            for col, cell in enumerate(maze_row):
                tile = pygame.Rect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE)
                color = COLOR_WALL if cell == 1 else COLOR_PATH
                pygame.draw.rect(screen, color, tile)
                pygame.draw.rect(screen, COLOR_GRID, tile, 1)

        goal_rect = pygame.Rect(
            GOAL_POS[1] * TILE_SIZE + 8,
            GOAL_POS[0] * TILE_SIZE + 8,
            TILE_SIZE - 16,
            TILE_SIZE - 16,
        )
        pygame.draw.rect(screen, COLOR_GOAL, goal_rect)

        for position, color in ((player_pos, COLOR_PLAYER), (enemy_pos, COLOR_ENEMY)):
            center = (
                position[1] * TILE_SIZE + TILE_SIZE // 2,
                position[0] * TILE_SIZE + TILE_SIZE // 2,
            )
            pygame.draw.circle(screen, color, center, TILE_SIZE // 3)

        pygame.draw.rect(
            screen,
            COLOR_BACKGROUND,
            (0, SCREEN_HEIGHT - HUD_HEIGHT, SCREEN_WIDTH, HUD_HEIGHT),
        )
        if game_state == "won":
            message = "You win!"
        elif game_state == "lost":
            message = "Caught by the enemy!"
        else:
            message = "Reach the green exit. Avoid the red enemy."
        text = font.render(message, True, COLOR_TEXT)
        screen.blit(text, (12, SCREEN_HEIGHT - HUD_HEIGHT + 9))
        pygame.display.flip()

    running = True
    while running:
        now = pygame.time.get_ticks()

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN and game_state == "playing":
                movement = movement_keys.get(event.key)
                if movement:
                    next_pos = (player_pos[0] + movement[0], player_pos[1] + movement[1])
                    row, col = next_pos
                    if (
                        0 <= row < len(STARTER_MAZE)
                        and 0 <= col < len(STARTER_MAZE[row])
                        and STARTER_MAZE[row][col] == 0
                    ):
                        player_pos = next_pos
                    if player_pos == GOAL_POS:
                        game_state = "won"
                    elif player_pos == enemy_pos:
                        game_state = "lost"

        if (
            game_state == "playing"
            and now - last_enemy_move >= ENEMY_MOVE_INTERVAL
        ):
            enemy_pos = get_next_enemy_move(STARTER_MAZE, enemy_pos, player_pos)
            last_enemy_move = now
            if enemy_pos == player_pos:
                game_state = "lost"

        draw()
        clock.tick(FPS)

    pygame.quit()


if __name__ == "__main__":
    main()