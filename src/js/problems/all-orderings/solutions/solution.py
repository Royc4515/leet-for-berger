# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0046.Permutations/Solution.py
def permute(nums: list[int]) -> list[list[int]]:
    # O(n! * n) time - fill positions left to right with any unused value. Sorting first and
    # trying values in ascending order emits the permutations in lexicographic order.
    a = sorted(nums)
    n = len(a)
    vis = [False] * n
    t = [0] * n
    ans = []

    def dfs(i: int):
        if i == n:
            ans.append(t[:])
            return
        for j, x in enumerate(a):
            if not vis[j]:
                vis[j] = True
                t[i] = x
                dfs(i + 1)
                # Release the value so sibling branches can place it later.
                vis[j] = False

    dfs(0)
    return ans
