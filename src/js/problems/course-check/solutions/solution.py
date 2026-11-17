# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0207.Course%20Schedule/Solution.py
from collections import deque


def can_finish(num_courses: int, prerequisites: list[list[int]]) -> bool:
    # O(V + E) time - Kahn's algorithm. Iterative on purpose: chains of 10^5 courses would
    # exceed Python's recursion limit in a DFS.
    g = [[] for _ in range(num_courses)]
    indeg = [0] * num_courses
    for a, b in prerequisites:
        g[b].append(a)
        indeg[a] += 1
    q = deque(i for i, d in enumerate(indeg) if d == 0)
    taken = 0
    while q:
        i = q.popleft()
        taken += 1
        for j in g[i]:
            indeg[j] -= 1
            if indeg[j] == 0:
                q.append(j)
    # Courses on a cycle never reach in-degree 0, so they are never taken.
    return taken == num_courses
