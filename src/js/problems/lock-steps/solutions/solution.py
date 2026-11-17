# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0700-0799/0752.Open%20the%20Lock/Solution.py
from collections import deque


def open_lock(deadends: list[str], target: str) -> int:
    # O(10^4 * 8) - BFS over the 10^4 codes, stored as integers. One array marks both dead ends
    # and visited codes, so every check is O(1) however many dead ends there are.
    goal = int(target)
    if goal == 0:
        return 0
    blocked = [False] * 10000
    for d in deadends:
        blocked[int(d)] = True
    if blocked[0]:
        return -1
    blocked[0] = True
    q = deque([0])
    ans = 0
    while q:
        ans += 1
        for _ in range(len(q)):
            p = q.popleft()
            place = 1
            for _ in range(4):
                digit = p // place % 10
                # Turning up from 9 wraps to 0 and down from 0 wraps to 9.
                for nd in ((digit + 1) % 10, (digit + 9) % 10):
                    t = p + (nd - digit) * place
                    if t == goal:
                        return ans
                    if not blocked[t]:
                        blocked[t] = True
                        q.append(t)
                place *= 10
    return -1
