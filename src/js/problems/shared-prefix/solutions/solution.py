def longest_common_prefix(strs: list[str]) -> str:
    # O(total length): the smallest and largest words in sorted order first differ exactly where
    # the whole list first stops agreeing, so comparing just those two is enough.
    lo, hi = min(strs), max(strs)
    for i, ch in enumerate(lo):
        if ch != hi[i]:
            return lo[:i]
    return lo
