from math import gcd


def max_points(points: list[list[int]]) -> int:
    # O(n^2) time - for each anchor, count the other points per exact direction.
    n = len(points)
    if n <= 2:
        return n
    best = 1
    for i in range(n):
        x1, y1 = points[i]
        directions = {}
        for j in range(i + 1, n):
            dx = points[j][0] - x1
            dy = points[j][1] - y1
            g = gcd(dx, dy)
            dx //= g
            dy //= g
            # One canonical sign per line: (1, -1) and (-1, 1) are the same direction.
            if dx < 0 or (dx == 0 and dy < 0):
                dx, dy = -dx, -dy
            key = (dx, dy)
            directions[key] = directions.get(key, 0) + 1
        if directions:
            best = max(best, max(directions.values()) + 1)
    return best
