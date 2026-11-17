# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0078.Subsets/Solution.py
def subsets(nums: list[int]) -> list[list[int]]:
    # O(2^n * n) time - depth-first search over sorted values. Recording each partial subset on
    # entry, before it is extended, puts every prefix ahead of its extensions: lexicographic order.
    a = sorted(nums)
    ans = []
    t = []

    def dfs(start: int):
        ans.append(t[:])
        for i in range(start, len(a)):
            t.append(a[i])
            dfs(i + 1)
            t.pop()

    dfs(0)
    return ans
