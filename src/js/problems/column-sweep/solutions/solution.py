from collections import deque


def column_order(root: Optional[TreeNode]) -> list[list[int]]:
    # O(n) time and space: a level-order walk appends values to their column in exactly the
    # required order (higher first, left before right), so nothing needs sorting.
    if root is None:
        return []
    columns = {}
    low = high = 0
    queue = deque([(root, 0)])
    while queue:
        node, col = queue.popleft()
        columns.setdefault(col, []).append(node.val)
        low = min(low, col)
        high = max(high, col)
        if node.left:
            queue.append((node.left, col - 1))
        if node.right:
            queue.append((node.right, col + 1))
    # Columns are met in no particular order, but they form one contiguous range.
    return [columns[c] for c in range(low, high + 1)]
