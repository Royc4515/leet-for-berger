class Codec:
    # Pre-order with "#" for missing children: O(n) per call. The token position lives in a
    # local iterator, never in a field, so every deserialize call starts from the beginning.

    def __init__(self):
        pass

    def serialize(self, root: Optional[TreeNode]) -> str:
        out = []

        def walk(node):
            if node is None:
                out.append("#")
                return
            out.append(str(node.val))
            walk(node.left)
            walk(node.right)

        walk(root)
        # One join at the end instead of repeated concatenation keeps this linear.
        return ",".join(out)

    def deserialize(self, data: str) -> Optional[TreeNode]:
        tokens = iter(data.split(","))

        def build():
            token = next(tokens)
            if token == "#":
                return None
            node = TreeNode(int(token))
            # Pre-order: the whole left subtree comes before the right one.
            node.left = build()
            node.right = build()
            return node

        return build()
