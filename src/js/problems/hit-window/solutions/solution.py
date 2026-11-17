# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0362.Design%20Hit%20Counter/Solution.py
from bisect import bisect_left


class HitCounter:
    # O(1) per hit, O(log n) per query: timestamps never decrease, so the list of hits is
    # already sorted and the window start is one binary search away.

    def __init__(self):
        self.ts = []

    def hit(self, timestamp: int) -> None:
        self.ts.append(timestamp)

    def get_hits(self, timestamp: int) -> int:
        # The window is (timestamp - 300, timestamp]: its oldest second is timestamp - 299.
        return len(self.ts) - bisect_left(self.ts, timestamp - 300 + 1)
