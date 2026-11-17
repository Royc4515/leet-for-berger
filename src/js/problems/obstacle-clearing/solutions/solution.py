from collections import deque


def minimum_obstacles(grid: list[list[int]]) -> int:
    # O(rows * cols) - 0-1 BFS. Entering an empty cell costs 0 and an obstacle costs 1, so a
    # deque kept in order of cost replaces Dijkstra's heap: 0-cost moves go to the front.
    m, n = len(grid), len(grid[0])
    # Flat indexes (r * n + c) avoid building a tuple per visited cell.
    cells = [v for row in grid for v in row]
    total = m * n
    dist = [total] * total
    dist[0] = 0
    q = deque([0])
    while q:
        cur = q.popleft()
        d = dist[cur]
        r, c = divmod(cur, n)
        for nxt, ok in ((cur - n, r > 0), (cur + n, r < m - 1), (cur - 1, c > 0), (cur + 1, c < n - 1)):
            if not ok:
                continue
            w = cells[nxt]
            # Only a strict improvement is queued, so stale entries cost nothing extra.
            if d + w < dist[nxt]:
                dist[nxt] = d + w
                if w:
                    q.append(nxt)
                else:
                    q.appendleft(nxt)
    return dist[total - 1]
