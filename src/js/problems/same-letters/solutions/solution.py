def same_letters(s: str, t: str) -> bool:
    # O(n) time, O(1) space. Rearrangements have identical letter counts, so add for s and
    # subtract for t in one table and require all 26 counters to end at zero.
    if len(s) != len(t):
        return False
    count = [0] * 26
    for a, b in zip(s, t):
        count[ord(a) - 97] += 1
        count[ord(b) - 97] -= 1
    return not any(count)
