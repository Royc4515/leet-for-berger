# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0337.House%20Robber%20III/Solution.py
def rob(root: Optional[TreeNode]) -> int:
    # O(n) time, O(h) stack. Each node returns two totals for its subtree: with the node taken
    # and with it skipped. Returning both at once means no subtree is ever solved twice.
    def dfs(node: Optional[TreeNode]) -> tuple[int, int]:
        if node is None:
            return 0, 0
        left_take, left_skip = dfs(node.left)
        right_take, right_skip = dfs(node.right)
        # Taking the node forces both children to be skipped; skipping it frees them.
        take = node.val + left_skip + right_skip
        skip = max(left_take, left_skip) + max(right_take, right_skip)
        return take, skip

    return max(dfs(root))
