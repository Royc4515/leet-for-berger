# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0900-0999/0981.Time%20Based%20Key-Value%20Store/Solution.py
from bisect import bisect_right


class TimeMap:
    # O(1) per set, O(log n) per get: set timestamps only increase, so appending keeps each
    # key's versions sorted by time and a get is one binary search.

    def __init__(self):
        # key -> (timestamps, values), two parallel lists.
        self.ktv = {}

    def set(self, key: str, value: str, timestamp: int) -> None:
        times, values = self.ktv.setdefault(key, ([], []))
        times.append(timestamp)
        values.append(value)

    def get(self, key: str, timestamp: int) -> str:
        if key not in self.ktv:
            return ''
        times, values = self.ktv[key]
        # Number of versions at or before `timestamp`; the answer is the last of them.
        i = bisect_right(times, timestamp)
        return values[i - 1] if i else ''
