# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0249.Group%20Shifted%20Strings/Solution.py
def group_by_shift(words: list[str]) -> list[list[str]]:
    # O(n * k) time: every word is normalized once, then grouped by that key.
    # dict keeps insertion order, which gives first-appearance group order.
    groups = {}
    for w in words:
        diff = ord(w[0]) - ord("a")
        # Shift back so the word starts with "a"; + 26 keeps wrapped letters non-negative.
        key = "".join(chr((ord(c) - ord("a") - diff + 26) % 26 + ord("a")) for c in w)
        groups.setdefault(key, []).append(w)
    return list(groups.values())
