# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0700-0799/0787.Cheapest%20Flights%20Within%20K%20Stops/Solution.py
def find_cheapest_price(n: int, flights: list[list[int]], src: int, dst: int, k: int) -> int:
    # O(k * E) - Bellman-Ford limited to k + 1 rounds: after round j, dist holds the cheapest
    # cost using at most j flights.
    inf = float("inf")
    dist = [inf] * n
    dist[src] = 0
    for _ in range(k + 1):
        # Every flight reads the previous round's costs; relaxing in place could chain several
        # flights in one round and break the stop limit.
        backup = dist.copy()
        changed = False
        for f, t, p in flights:
            if backup[f] + p < dist[t]:
                dist[t] = backup[f] + p
                changed = True
        # Nothing improved, so more rounds cannot improve anything either.
        if not changed:
            break
    return -1 if dist[dst] == inf else dist[dst]
