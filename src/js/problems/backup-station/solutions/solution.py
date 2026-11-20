def backup_stations(c: int, links: list[list[int]], queries: list[list[int]]) -> list[int]:
    # Nearly O(c + links + queries) - union-find once, then one forward-only pointer per grid.
    parent = list(range(c))

    def find(x: int) -> int:
        # Path halving keeps the trees flat without recursion (a 10^5 line would be too deep).
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for u, v in links:
        parent[find(u - 1)] = find(v - 1)

    # Stations of each grid in increasing order: visiting ids ascending fills every list sorted.
    members: dict[int, list[int]] = {}
    root = [0] * c
    for i in range(c):
        root[i] = find(i)
        members.setdefault(root[i], []).append(i)
    ptr = dict.fromkeys(members, 0)
    online = [True] * c

    answers = []
    for kind, x in queries:
        x -= 1
        if kind == 2:
            online[x] = False
        elif online[x]:
            answers.append(x + 1)
        else:
            group = members[root[x]]
            p = ptr[root[x]]
            # A station never comes back online, so the pointer only moves forward: every
            # station is skipped at most once over the whole run.
            while p < len(group) and not online[group[p]]:
                p += 1
            ptr[root[x]] = p
            answers.append(group[p] + 1 if p < len(group) else -1)
    return answers
