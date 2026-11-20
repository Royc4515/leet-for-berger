def max_paren_depth(s: str) -> int:
    # O(n) time, O(1) space: the counter is the number of brackets open right now.
    depth = 0
    best = 0
    for ch in s:
        if ch == "(":
            depth += 1
            # A new peak can only appear right after an opening bracket.
            best = max(best, depth)
        elif ch == ")":
            depth -= 1
    return best
