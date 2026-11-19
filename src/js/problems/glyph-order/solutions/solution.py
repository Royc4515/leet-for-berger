# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0269.Alien%20Dictionary/Solution.py
def glyph_order(words: list[str]) -> str:
    # O(C + 26^2): neighbors give one "x before y" edge at their first difference, then Kahn's
    # algorithm always takes the smallest free letter, which yields the alphabetically first order.
    present = [False] * 26
    for w in words:
        for ch in w:
            present[ord(ch) - 97] = True
    edge = [[False] * 26 for _ in range(26)]
    indeg = [0] * 26
    for a, b in zip(words, words[1:]):
        m = min(len(a), len(b))
        j = 0
        while j < m and a[j] == b[j]:
            j += 1
        if j == m:
            # A word directly above its own proper prefix fits no order at all.
            if len(a) > len(b):
                return ""
            continue
        u, v = ord(a[j]) - 97, ord(b[j]) - 97
        # Count a repeated fact once, or its indegree never drops to zero.
        if not edge[u][v]:
            edge[u][v] = True
            indeg[v] += 1
    total = sum(present)
    used = [False] * 26
    out = []
    while len(out) < total:
        pick = next((c for c in range(26) if present[c] and not used[c] and indeg[c] == 0), -1)
        # Letters remain but none is free: they lie on a cycle.
        if pick == -1:
            return ""
        used[pick] = True
        out.append(chr(97 + pick))
        for v in range(26):
            if edge[pick][v]:
                indeg[v] -= 1
    return "".join(out)
