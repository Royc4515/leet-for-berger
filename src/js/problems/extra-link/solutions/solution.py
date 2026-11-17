# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0600-0699/0684.Redundant%20Connection/Solution.py
def find_redundant_connection(edges: list[list[int]]) -> list[int]:
    # O(n alpha(n)) time - union-find in input order; the first link whose ends are already
    # connected closes the cycle, and every other cycle link came before it.
    n = len(edges)
    p = list(range(n + 1))
    size = [1] * (n + 1)

    def find(x: int) -> int:
        # Iterative with path halving: a recursive find can go 10^5 deep before compressing.
        while p[x] != x:
            p[x] = p[p[x]]
            x = p[x]
        return x

    for a, b in edges:
        pa, pb = find(a), find(b)
        if pa == pb:
            return [a, b]
        # Union by size keeps every tree shallow.
        if size[pa] < size[pb]:
            pa, pb = pb, pa
        p[pb] = pa
        size[pa] += size[pb]
    return []
