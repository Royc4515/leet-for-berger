import heapq


def network_delay_time(times: list[list[int]], n: int, k: int) -> int:
    # O((V + E) log V) - Dijkstra with a binary heap. Delays are never negative, so the node
    # with the smallest tentative time can no longer improve once it is popped.
    # Links and heap entries are packed into single ints (n < 2^17, w < 2^14): comparing ints
    # is much faster in Python than comparing tuples. A heap entry orders by time first.
    adj = [[] for _ in range(n + 1)]
    for u, v, w in times:
        adj[u].append(v << 14 | w)
    inf = 1 << 62
    dist = [inf] * (n + 1)
    dist[k] = 0
    heap = [k]
    pop, push = heapq.heappop, heapq.heappush
    while heap:
        top = pop(heap)
        d, u = top >> 17, top & 131071
        # A stale entry: u was already settled with a smaller time.
        if d > dist[u]:
            continue
        for e in adj[u]:
            nd = d + (e & 16383)
            v = e >> 14
            if nd < dist[v]:
                dist[v] = nd
                push(heap, nd << 17 | v)
    # The last node to hear the signal decides; one that never hears it makes the answer -1.
    ans = max(dist[1:])
    return -1 if ans == inf else ans
