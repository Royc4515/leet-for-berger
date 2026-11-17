# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/2200-2299/2223.Sum%20of%20Scores%20of%20Built%20Strings/Solution.py
def prefix_score_sum(s: str) -> int:
    # O(n) - the Z-function. z[i] is the score of the suffix at i; [l, r] is the rightmost
    # segment known to equal a prefix, and inside it z values are copied instead of recomputed.
    n = len(s)
    z = [0] * n
    l = r = 0
    for i in range(1, n):
        if i <= r:
            # s[i..r] equals s[i-l..r-l], so z[i - l] applies, capped at the known segment.
            z[i] = min(r - i + 1, z[i - l])
        while i + z[i] < n and s[z[i]] == s[i + z[i]]:
            z[i] += 1
        if i + z[i] - 1 > r:
            l, r = i, i + z[i] - 1
    # The whole string scores n; z[0] is left at 0 by convention.
    return n + sum(z)
