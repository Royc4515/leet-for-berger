def matches_abbreviation(word: str, abbr: str) -> bool:
    # O(n + m) time, O(1) space: two pointers, and a number moves the word pointer without
    # reading the letters it skips (a number can be 10^9, so never expand it).
    i = j = 0
    n, m = len(word), len(abbr)
    while i < n and j < m:
        c = abbr[j]
        if c.isdigit():
            # A number may not start with 0, which also rules out the number 0.
            if c == "0":
                return False
            num = 0
            while j < m and abbr[j].isdigit():
                num = num * 10 + int(abbr[j])
                j += 1
            i += num
        else:
            if word[i] != c:
                return False
            i += 1
            j += 1
    # Both strings must end together. A skip that overshoots leaves i past the end of word.
    return i == n and j == m
