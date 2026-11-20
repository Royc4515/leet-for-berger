def balanced_pairs(n: int, max_depth: int) -> list[str]:
    # O(C * n) time for C answers: every path of the search is a valid prefix, so nothing is wasted.
    out = []
    path = []

    def dfs(opened: int, closed: int) -> None:
        if len(path) == 2 * n:
            out.append("".join(path))
            return
        # Open while pairs remain and the depth (opened - closed) is under the limit.
        # "(" is tried first because it sorts before ")", which keeps the output in order.
        if opened < n and opened - closed < max_depth:
            path.append("(")
            dfs(opened + 1, closed)
            path.pop()
        # Close only while something is open.
        if closed < opened:
            path.append(")")
            dfs(opened, closed + 1)
            path.pop()

    dfs(0, 0)
    return out
