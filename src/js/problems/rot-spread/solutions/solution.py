from collections import deque


def minutes_to_rot(grid: list[list[int]]) -> int:
    # O(rows * cols) time and space: BFS in waves, with every rotten cell in the first wave.
    rows, cols = len(grid), len(grid[0])
    queue = deque()
    fresh = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 2:
                queue.append((r, c))
            elif grid[r][c] == 1:
                fresh += 1

    minutes = 0
    # Stopping as soon as no fresh fruit is left keeps the final wave, which rots nothing, from
    # being counted as a minute.
    while queue and fresh:
        for _ in range(len(queue)):
            r, c = queue.popleft()
            for nr, nc in ((r - 1, c), (r + 1, c), (r, c - 1), (r, c + 1)):
                if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1:
                    # Marking when queued, not when popped, so a cell joins the queue once.
                    grid[nr][nc] = 2
                    fresh -= 1
                    queue.append((nr, nc))
        minutes += 1
    return -1 if fresh else minutes
