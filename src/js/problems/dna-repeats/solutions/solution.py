# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0187.Repeated%20DNA%20Sequences/Solution.py
from collections import Counter


def repeated_windows(s: str) -> list[str]:
    # O(n) windows (each slice is 10 characters), then a sort of the repeated ones.
    cnt = Counter()
    ans = []
    for i in range(len(s) - 10 + 1):
        t = s[i : i + 10]
        cnt[t] += 1
        # Report on the second sighting only, so a window seen three times is listed once.
        if cnt[t] == 2:
            ans.append(t)
    # The order of discovery is by second occurrence; the statement asks for lexicographic.
    ans.sort()
    return ans
