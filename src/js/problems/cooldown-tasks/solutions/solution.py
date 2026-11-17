# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0600-0699/0621.Task%20Scheduler/Solution.py
from collections import Counter


def least_interval(tasks: str, n: int) -> int:
    # O(len) time - only the counts matter. The most frequent kind (count x) needs x - 1 frames of
    # n + 1 slots, then one final slot for each kind that ties for x.
    cnt = Counter(tasks)
    x = max(cnt.values())
    s = sum(v == x for v in cnt.values())
    # When the other kinds overflow the frames no slot is idle, so the length is the answer.
    return max(len(tasks), (x - 1) * (n + 1) + s)
