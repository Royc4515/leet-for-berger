# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0210.Course%20Schedule%20II/Solution.py
import heapq


def find_order(num_courses: int, prerequisites: list[list[int]]) -> list[int]:
    # O((V + E) log V) time - Kahn's algorithm with a min-heap instead of a FIFO queue, so the
    # smallest available course is always taken next. That greedy choice gives the
    # lexicographically smallest order: taking a smaller course never blocks anything.
    g = [[] for _ in range(num_courses)]
    indeg = [0] * num_courses
    for a, b in prerequisites:
        g[b].append(a)
        indeg[a] += 1
    heap = [i for i, d in enumerate(indeg) if d == 0]
    heapq.heapify(heap)
    ans = []
    while heap:
        i = heapq.heappop(heap)
        ans.append(i)
        for j in g[i]:
            indeg[j] -= 1
            if indeg[j] == 0:
                heapq.heappush(heap, j)
    # Courses on a cycle are never released, so a short order means no valid order exists.
    return ans if len(ans) == num_courses else []
