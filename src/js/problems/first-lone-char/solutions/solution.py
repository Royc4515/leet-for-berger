def first_lone_char(s: str) -> int:
    # O(n) time, O(1) space: count all 26 letters first, then find the earliest index with count 1.
    counts = [0] * 26
    base = ord("a")
    for ch in s:
        counts[ord(ch) - base] += 1
    for i, ch in enumerate(s):
        if counts[ord(ch) - base] == 1:
            return i
    return -1
