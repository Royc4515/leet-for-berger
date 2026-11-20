def shortest_clear_path(grid: list[list[int]]) -> int:
    # O(n^2) time and space: breadth-first search by waves from the top-left cell. Every move
    # costs one, so the wave that first holds the target is the shortest route.
    n = len(grid)
    if grid[0][0] == 1 or grid[n - 1][n - 1] == 1:
        return -1
    seen = [[False] * n for _ in range(n)]
    seen[0][0] = True
    frontier = [(0, 0)]
    cells = 1
    while frontier:
        nxt = []
        for r, c in frontier:
            if r == n - 1 and c == n - 1:
                return cells
            for dr in (-1, 0, 1):
                for dc in (-1, 0, 1):
                    nr, nc = r + dr, c + dc
                    if 0 <= nr < n and 0 <= nc < n and grid[nr][nc] == 0 and not seen[nr][nc]:
                        # Marking when queued, not when popped, so a cell joins the queue once.
                        seen[nr][nc] = True
                        nxt.append((nr, nc))
        frontier = nxt
        cells += 1
    return -1
