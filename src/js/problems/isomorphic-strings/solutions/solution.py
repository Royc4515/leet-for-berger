def is_isomorphic(s: str, t: str) -> bool:
    # O(n) time - one map per direction; each catches a different kind of collision.
    fwd, back = {}, {}
    for a, b in zip(s, t):
        if fwd.setdefault(a, b) != b or back.setdefault(b, a) != a:
            return False
    return len(s) == len(t)
