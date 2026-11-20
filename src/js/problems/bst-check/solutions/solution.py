from math import inf


def is_valid_bst(root: Optional[TreeNode]) -> bool:
    # O(n) time, O(h) space: every node must lie strictly inside the interval its ancestors allow.
    # inf and -inf mean "no bound", so values at the ends of the 32-bit range are never special.
    def check(node: Optional[TreeNode], low: float, high: float) -> bool:
        if node is None:
            return True
        if not low < node.val < high:
            return False
        # Going left, this value caps the interval from above; going right, from below.
        return check(node.left, low, node.val) and check(node.right, node.val, high)

    return check(root, -inf, inf)
