# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0230.Kth%20Smallest%20Element%20in%20a%20BST/Solution.py
def kth_smallest(root: Optional[TreeNode], k: int) -> int:
    # O(h + k) time, O(h) space: an in-order walk of a BST yields values in ascending order, so
    # the k-th node popped is the answer and the rest of the tree is never visited.
    stack = []
    node = root
    while node or stack:
        if node:
            stack.append(node)
            node = node.left
        else:
            node = stack.pop()
            k -= 1
            if k == 0:
                return node.val
            node = node.right
    return -1
