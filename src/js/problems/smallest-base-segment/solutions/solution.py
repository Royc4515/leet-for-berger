def smallest_base_segment(s: str) -> str:
    # O(n) time, O(n) space - KMP prefix function.
    n = len(s)
    pi = [0] * n
    for i in range(1, n):
        k = pi[i - 1]
        # Fall back through shorter borders until the next char can extend one.
        while k > 0 and s[i] != s[k]:
            k = pi[k - 1]
        if s[i] == s[k]:
            k += 1
        pi[i] = k
    period = n - pi[-1]
    # A period only builds s from whole copies when it divides n ("ababa" -> itself).
    return s[:period] if n % period == 0 else s
