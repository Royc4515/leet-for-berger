def min_cost_connect_points(points: list[list[int]]) -> int:
    # O(n^2) - Prim's algorithm on the complete graph without building it. best[i] is the
    # cheapest wire from outside point i into the tree; each step adds the point with the
    # smallest one and lowers the others through the new point.
    xs = [p[0] for p in points[1:]]
    ys = [p[1] for p in points[1:]]
    x0, y0 = points[0]
    best = [abs(x - x0) + abs(y - y0) for x, y in zip(xs, ys)]
    total = 0
    while best:
        i = best.index(min(best))
        total += best[i]
        x0, y0 = xs[i], ys[i]
        # Swap the chosen point to the end and drop it, so the outside points stay contiguous.
        last = len(best) - 1
        xs[i], ys[i], best[i] = xs[last], ys[last], best[last]
        xs.pop()
        ys.pop()
        best.pop()
        # One pass over parallel lists: much faster in Python than an indexed inner loop.
        best = [b if b < (d := abs(x - x0) + abs(y - y0)) else d for b, x, y in zip(best, xs, ys)]
    return total
