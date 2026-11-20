def rearrange_hills(s: str) -> str:
    # O(n^2) worst case (a deeply nested hill re-slices and sorts at every level).
    # Cut into top-level hills, rearrange inside each, then place the pieces largest first.
    pieces = []
    height = 0
    start = 0
    for i, ch in enumerate(s):
        height += 1 if ch == "1" else -1
        if height == 0:
            # A piece is "1" + hill + "0": strip the outer pair before recursing, or the
            # recursion would never get smaller.
            pieces.append("1" + rearrange_hills(s[start + 1:i]) + "0")
            start = i + 1
    # No piece is a prefix of another, so plain descending text order is the best concatenation.
    pieces.sort(reverse=True)
    return "".join(pieces)
