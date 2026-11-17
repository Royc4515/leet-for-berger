# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0124.Binary%20Tree%20Maximum%20Path%20Sum/Solution.py
def max_path_sum(root: Optional[TreeNode]) -> int:
    # O(n) time, O(h) stack. Each node returns its best downward chain; the answer also tries
    # the path that bends at the node and uses both chains.
    # A path has at least one node, so the root alone is a valid starting answer.
    best = root.val

    def down(node: Optional[TreeNode]) -> int:
        nonlocal best
        if node is None:
            return 0
        # A negative chain only lowers the sum, so it is dropped (counted as 0).
        left = max(0, down(node.left))
        right = max(0, down(node.right))
        best = max(best, node.val + left + right)
        # The parent can extend only one side: a path cannot fork.
        return node.val + max(left, right)

    down(root)
    return best
