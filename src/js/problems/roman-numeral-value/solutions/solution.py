VALUES = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}


def roman_to_int(s: str) -> int:
    # O(n) time - each symbol only needs its right neighbour to know its sign.
    total = 0
    for i, ch in enumerate(s):
        v = VALUES[ch]
        # A smaller symbol before a larger one is the left half of a subtractive pair (IV, CM).
        if i + 1 < len(s) and v < VALUES[s[i + 1]]:
            total -= v
        else:
            total += v
    return total
