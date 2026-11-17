MOD = 1_000_000_007


def power_mod(x: int, n: int) -> int:
    # O(log n) time - binary exponentiation, written out (the built-in three-argument pow does the
    # same thing, but the loop is what an interviewer asks for).
    base = x % MOD
    result = 1
    while n > 0:
        # Each set bit of n contributes the matching square x^(2^k).
        if n & 1:
            result = result * base % MOD
        base = base * base % MOD
        n >>= 1
    return result
