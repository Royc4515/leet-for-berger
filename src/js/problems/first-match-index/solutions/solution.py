def first_match_index(haystack: str, needle: str) -> int:
    # O(n + m) - Knuth-Morris-Pratt. fail[i] is the length of the longest proper prefix of
    # needle[:i + 1] that is also its suffix: after a mismatch, that much is already matched.
    m = len(needle)
    fail = [0] * m
    k = 0
    for i in range(1, m):
        while k and needle[i] != needle[k]:
            k = fail[k - 1]
        if needle[i] == needle[k]:
            k += 1
        fail[i] = k
    # k counts needle characters matched so far; the text pointer never moves back.
    k = 0
    for i, ch in enumerate(haystack):
        while k and ch != needle[k]:
            k = fail[k - 1]
        if ch == needle[k]:
            k += 1
            if k == m:
                return i - m + 1
    return -1
