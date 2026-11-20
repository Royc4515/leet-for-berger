def collect_coins(coins: list[int], edges: list[list[int]]) -> int:
    # O(n) - peel the tree from the outside. A closed walk over the m nodes that must be visited
    # crosses each of their m - 1 edges twice, so the answer is 2 * (m - 1).
    n = len(coins)
    if 1 not in coins:
        return 0
    # For each node: its degree and the xor of its neighbours' numbers. A leaf has one neighbour,
    # so its xor is that neighbour, and no adjacency lists are needed.
    deg = [0] * n
    xr = [0] * n
    for a, b in edges:
        deg[a] += 1
        deg[b] += 1
        xr[a] ^= b
        xr[b] ^= a
    gone = [False] * n
    alive = n

    # Pass 1: a leaf without a coin is never worth visiting. Removing one may expose another.
    queue = [v for v in range(n) if deg[v] == 1 and coins[v] == 0]
    for v in queue:
        gone[v] = True
    for v in queue:  # the list grows while we walk it
        alive -= 1
        p = xr[v]
        xr[p] ^= v
        deg[p] -= 1
        if deg[p] == 1 and coins[p] == 0 and not gone[p]:
            gone[p] = True
            queue.append(p)

    # Pass 2, twice: a coin within distance 2 of the walk is collected from there, so the two
    # outermost layers of nodes need not be visited, whatever they hold.
    for _ in range(2):
        leaves = [v for v in range(n) if not gone[v] and deg[v] == 1]
        for v in leaves:
            gone[v] = True
            alive -= 1
            # If the only neighbour was a leaf too (two nodes left), it is already gone.
            if deg[v] == 1:
                p = xr[v]
                xr[p] ^= v
                deg[p] -= 1
    return max(0, 2 * (alive - 1))
