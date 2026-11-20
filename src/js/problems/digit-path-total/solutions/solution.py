def digit_path_total(root: Optional[TreeNode]) -> int:
    # O(n) time, O(h) space: carry the number the path reads so far down to the leaves.
    def walk(node: Optional[TreeNode], above: int) -> int:
        if node is None:
            return 0
        # Appending a digit to a decimal number: multiply by ten, then add it.
        here = above * 10 + node.val
        # Only a node with no children ends a path; a missing child contributes nothing.
        if node.left is None and node.right is None:
            return here
        return walk(node.left, here) + walk(node.right, here)

    return walk(root, 0)
