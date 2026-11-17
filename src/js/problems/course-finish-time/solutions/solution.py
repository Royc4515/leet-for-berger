# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/2000-2099/2050.Parallel%20Courses%20III/Solution.py
from collections import deque


def minimum_time(n: int, relations: list[list[int]], time: list[int]) -> int:
    # O(n + m) - Kahn's topological order. f[i] is the month course i finishes: its own time
    # plus the latest finish among its prerequisites, final once all of them are processed.
    # A queue rather than a recursive DFS: the prerequisites can chain all 5 * 10^4 courses.
    g = [[] for _ in range(n)]
    indeg = [0] * n
    for a, b in relations:
        g[a - 1].append(b - 1)
        indeg[b - 1] += 1
    q = deque()
    f = [0] * n
    ans = 0
    for i, (v, t) in enumerate(zip(indeg, time)):
        if v == 0:
            q.append(i)
            f[i] = t
            ans = max(ans, t)
    while q:
        i = q.popleft()
        for j in g[i]:
            f[j] = max(f[j], f[i] + time[j])
            ans = max(ans, f[j])
            indeg[j] -= 1
            if indeg[j] == 0:
                q.append(j)
    return ans
