# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0070.Climbing%20Stairs/Solution.py
MOD = 1_000_000_007


def climb_stairs(n: int) -> int:
    # O(n) time, O(1) space - the last move is 1 or 2 steps, so ways(n) = ways(n - 1) + ways(n - 2).
    a, b = 0, 1  # ways(-1) taken as 0 and ways(0) = 1 make the first iteration give ways(1) = 1
    for _ in range(n):
        # Reduce every step: Python would not overflow, but huge ints make the loop crawl.
        a, b = b, (a + b) % MOD
    return b
