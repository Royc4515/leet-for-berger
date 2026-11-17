# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0700-0799/0721.Accounts%20Merge/Solution.py
def accounts_merge(accounts: list[list[str]]) -> list[list[str]]:
    # O(E log E) for E emails - union-find over account indexes: each email links its account
    # to the first account seen with it, which merges transitively connected accounts.
    n = len(accounts)
    p = list(range(n))
    size = [1] * n

    def find(x: int) -> int:
        while p[x] != x:
            p[x] = p[p[x]]
            x = p[x]
        return x

    def union(a: int, b: int) -> None:
        pa, pb = find(a), find(b)
        if pa == pb:
            return
        # Union by size keeps the trees shallow.
        if size[pa] < size[pb]:
            pa, pb = pb, pa
        p[pb] = pa
        size[pa] += size[pb]

    owner = {}
    for i, (_, *emails) in enumerate(accounts):
        for email in emails:
            if email in owner:
                union(i, owner[email])
            else:
                owner[email] = i
    # Iterating the owner map visits each distinct email once, so no duplicates survive.
    groups = {}
    for email, i in owner.items():
        groups.setdefault(find(i), []).append(email)
    ans = [[accounts[root][0]] + sorted(emails) for root, emails in groups.items()]
    # Python compares strings by code point, which is the required order.
    ans.sort(key=lambda acc: (acc[0], acc[1]))
    return ans
