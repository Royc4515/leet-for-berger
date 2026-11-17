# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0800-0899/0847.Shortest%20Path%20Visiting%20All%20Nodes/Solution.py
def shortest_path_length(n: int, edges: list[list[int]]) -> int:
    # O(2^n * n^2) - BFS over states (node, set of visited nodes as a bitmask). A walk may
    # revisit nodes, so the node alone is not a state. All n single-node states start at
    # distance 0, which tries every starting node in one search.
    graph = [[] for _ in range(n)]
    for a, b in edges:
        graph[a].append(b)
        graph[b].append(a)
    full = (1 << n) - 1
    # vis is indexed by mask * n + node: a flat list is much faster than a set of tuples.
    vis = [False] * (n << n)
    q = []
    for i in range(n):
        q.append((i, 1 << i))
        vis[(1 << i) * n + i] = True
    ans = 0
    while True:
        nxt = []
        for i, st in q:
            if st == full:
                return ans
            for j in graph[i]:
                nst = st | 1 << j
                if not vis[nst * n + j]:
                    vis[nst * n + j] = True
                    nxt.append((j, nst))
        q = nxt
        ans += 1
