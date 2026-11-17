# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0104.Maximum%20Depth%20of%20Binary%20Tree/Solution.py
def max_depth(root: Optional[TreeNode]) -> int:
    # O(n) time, O(h) stack: a tree is one node taller than its taller subtree. The height cap
    # (500) keeps this recursion well inside Python's default limit of 1000 frames.
    if root is None:
        return 0
    return 1 + max(max_depth(root.left), max_depth(root.right))
