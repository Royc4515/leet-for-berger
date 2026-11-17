# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/2500-2599/2514.Count%20Anagrams/Solution.py
from collections import Counter

MOD = 10**9 + 7


def count_arrangements(s: str) -> int:
    # O(n + log MOD) - the answer is the product over words of len! / (c_a! * c_b! * ...).
    # Both products are built letter by letter: the i-th letter of a word multiplies the
    # numerator by i, and the k-th copy of a letter multiplies the denominator by k.
    ans = mul = 1
    for w in s.split(" "):
        cnt = Counter()
        for i, c in enumerate(w, 1):
            cnt[c] += 1
            mul = mul * cnt[c] % MOD
            ans = ans * i % MOD
    # MOD is prime, so dividing is multiplying by the inverse; one inverse at the end suffices.
    return ans * pow(mul, MOD - 2, MOD) % MOD
