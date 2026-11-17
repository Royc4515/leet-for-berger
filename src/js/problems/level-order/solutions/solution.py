from collections import deque


def level_order(root: Optional[TreeNode]) -> list[list[int]]:
    # O(n) time, O(w) space - BFS, one level per outer iteration.
    if root is None:
        return []
    out = []
    queue = deque([root])
    while queue:
        # The queue holds exactly one level right now; its length is that level's size.
        level = []
        for _ in range(len(queue)):
            node = queue.popleft()
            level.append(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        out.append(level)
    return out
