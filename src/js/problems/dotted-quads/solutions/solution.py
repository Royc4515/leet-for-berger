def dotted_quads(s: str) -> list[str]:
    # O(1) for bounded input: 3 choices for each of 4 parts. Shorter parts are tried first,
    # and a dot sorts before any digit, so the answers come out in dictionary order.
    out = []
    parts = []

    def dfs(pos: int) -> None:
        left = 4 - len(parts)
        rest = len(s) - pos
        # Each remaining part takes 1 to 3 digits; anything else is a dead end.
        if rest < left or rest > left * 3:
            return
        if left == 0:
            out.append(".".join(parts))
            return
        for length in range(1, 4):
            part = s[pos:pos + length]
            # A leading zero is allowed only for the single digit "0".
            if length > 1 and part[0] == "0":
                break
            if int(part) > 255:
                break
            parts.append(part)
            dfs(pos + length)
            parts.pop()

    dfs(0)
    return out
