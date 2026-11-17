# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0500-0599/0509.Fibonacci%20Number/Solution.py
MOD = 1_000_000_007


def fibonacci_mod(n: int) -> int:
    # O(n) time, O(1) space - only the last two values are needed. A loop instead of recursion:
    # the plain recursion is exponential and a memoized one is 10^6 frames deep.
    a, b = 0, 1
    for _ in range(n):
        # Reducing every step keeps the numbers small; Python would otherwise carry huge integers.
        a, b = b, (a + b) % MOD
    return a
