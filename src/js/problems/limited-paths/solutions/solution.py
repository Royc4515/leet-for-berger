# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/1600-1699/1697.Checking%20Existence%20of%20Edge%20Length%20Limited%20Paths/Solution.py
def distance_limited_paths_exist(n: int, edge_list: list[list[int]], queries: list[list[int]]) -> list[bool]:
    # O(E log E + Q log Q) - answer the queries offline in increasing limit. The usable edge
    # set only grows with the limit, so one union-find, fed edges in increasing length, serves
    # every query.
    p = list(range(n))
    size = [1] * n

    def find(x: int) -> int:
        # Iterative with path halving: a recursive find can go 10^5 deep on a path graph.
        while p[x] != x:
            p[x] = p[p[x]]
            x = p[x]
        return x

    edges = sorted(edge_list, key=lambda e: e[2])
    j = 0
    ans = [False] * len(queries)
    # Sorting indexes, not the queries, keeps track of where each answer belongs.
    for i in sorted(range(len(queries)), key=lambda k: queries[k][2]):
        a, b, limit = queries[i]
        # Strictly shorter: an edge equal to the limit stays out.
        while j < len(edges) and edges[j][2] < limit:
            u, v = find(edges[j][0]), find(edges[j][1])
            if u != v:
                if size[u] < size[v]:
                    u, v = v, u
                p[v] = u
                size[u] += size[v]
            j += 1
        ans[i] = find(a) == find(b)
    return ans
