# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0700-0799/0785.Is%20Graph%20Bipartite/Solution.py
from collections import deque


def is_bipartite(graph: list[list[int]]) -> bool:
    # O(V + E) time - color each component by BFS with alternating colors (1 and -1). BFS, not
    # recursive DFS: a 10^5-node path would exceed Python's recursion limit.
    n = len(graph)
    color = [0] * n
    # Every node is a possible start: the graph may be disconnected.
    for i in range(n):
        if color[i]:
            continue
        color[i] = 1
        q = deque([i])
        while q:
            a = q.popleft()
            for b in graph[a]:
                if color[b] == color[a]:
                    return False
                if color[b] == 0:
                    color[b] = -color[a]
                    q.append(b)
    return True
