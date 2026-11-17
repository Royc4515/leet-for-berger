def widest_palindrome(s: str) -> str:
    # O(n) - Manacher's algorithm. d1[i] is the radius of the longest odd palindrome centered at
    # i, d2[i] that of the longest even one whose right middle is i. Inside the rightmost
    # palindrome found so far [l, r], the mirror position gives a radius for free.
    n = len(s)
    best_len, best_start = 0, 0

    def consider(length: int, start: int) -> None:
        nonlocal best_len, best_start
        # Ties go to the leftmost start, whichever order the candidates arrive in.
        if length > best_len or (length == best_len and start < best_start):
            best_len, best_start = length, start

    d1 = [0] * n
    l, r = 0, -1
    for i in range(n):
        k = 1 if i > r else min(d1[l + r - i], r - i + 1)
        while i - k >= 0 and i + k < n and s[i - k] == s[i + k]:
            k += 1
        d1[i] = k
        if i + k - 1 > r:
            l, r = i - k + 1, i + k - 1
        consider(2 * k - 1, i - k + 1)

    d2 = [0] * n
    l, r = 0, -1
    for i in range(n):
        k = 0 if i > r else min(d2[l + r - i + 1], r - i + 1)
        while i - k - 1 >= 0 and i + k < n and s[i - k - 1] == s[i + k]:
            k += 1
        d2[i] = k
        if i + k - 1 > r:
            l, r = i - k, i + k - 1
        if k:
            consider(2 * k, i - k)

    return s[best_start : best_start + best_len]
