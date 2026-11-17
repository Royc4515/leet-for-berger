# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/1900-1999/1922.Count%20Good%20Numbers/Solution.py
MOD = 10**9 + 7


def count_good_strings(n: int) -> int:
    # O(log n) - positions are independent: (n + 1) // 2 even indices with 5 choices and n // 2
    # odd indices with 4. The three-argument pow is binary exponentiation modulo MOD.
    return pow(5, (n + 1) >> 1, MOD) * pow(4, n >> 1, MOD) % MOD
