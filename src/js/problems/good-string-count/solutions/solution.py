# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/2400-2499/2466.Count%20Ways%20To%20Build%20Good%20Strings/Solution.py
MOD = 10**9 + 7


def count_good_strings(low: int, high: int, zero: int, one: int) -> int:
    # O(high) time - different step sequences give different strings, so count sequences:
    # f[i] = f[i - zero] + f[i - one], the last step being a block of 0s or a block of 1s.
    # Bottom-up rather than recursive: 10^5 levels would overflow Python's recursion limit.
    f = [1] + [0] * high
    ans = 0
    for i in range(1, high + 1):
        if i >= zero:
            f[i] += f[i - zero]
        if i >= one:
            f[i] += f[i - one]
        f[i] %= MOD
        if i >= low:
            ans = (ans + f[i]) % MOD
    return ans
