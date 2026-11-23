import math


def visible_points(points: list[list[int]], angle: int, location: list[int]) -> int:
    # O(n log n) time - only directions matter: sort the polar angles and slide a window of the
    # view's width over them, with every angle repeated + 2 * pi so a view facing west wraps.
    x, y = location
    here = 0
    angles = []
    for px, py in points:
        # A point on the viewer has no direction and is visible whichever way you face.
        if px == x and py == y:
            here += 1
        else:
            angles.append(math.atan2(py - y, px - x))
    angles.sort()
    m = len(angles)
    angles += [a + 2 * math.pi for a in angles]
    # 1e-9 keeps a point exactly on the edge inside even if atan2 rounds it a hair outside.
    width = angle * math.pi / 180 + 1e-9
    best = 0
    i = 0
    for j in range(2 * m):
        while angles[j] - angles[i] > width:
            i += 1
        best = max(best, j - i + 1)
    # min(..., m): a window never holds the same direction twice.
    return min(best, m) + here
