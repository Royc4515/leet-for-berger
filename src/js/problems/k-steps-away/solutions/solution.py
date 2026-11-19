# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0800-0899/0863.All%20Nodes%20Distance%20K%20in%20Binary%20Tree/Solution.py
from collections import deque


def k_steps_away(root: Optional[TreeNode], target: int, k: int) -> list[int]:
    # O(n + m log m): nodes only point down, so record every parent first; then the tree is an
    # undirected graph and k rounds of breadth-first search from the target reach exactly distance k.
    parent = {root: None}
    start = None
    queue = deque([root])
    while queue:
        node = queue.popleft()
        if node.val == target:
            start = node
        for child in (node.left, node.right):
            if child:
                parent[child] = node
                queue.append(child)
    # The seen set stops the search from stepping back to where it came from.
    seen = {start}
    frontier = [start]
    for _ in range(k):
        nxt = []
        for node in frontier:
            for nb in (node.left, node.right, parent[node]):
                if nb and nb not in seen:
                    seen.add(nb)
                    nxt.append(nb)
        frontier = nxt
        if not frontier:
            break
    return sorted(node.val for node in frontier)
