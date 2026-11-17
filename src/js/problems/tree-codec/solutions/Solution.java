class Codec {
    // Pre-order with "#" for missing children: O(n) per call. The token position is a local,
    // never a field, so every deserialize call starts from the beginning.

    public Codec() {
    }

    public String serialize(TreeNode root) {
        // A StringBuilder keeps this linear; String += would copy the text for every node.
        StringBuilder sb = new StringBuilder();
        walk(root, sb);
        return sb.toString();
    }

    private void walk(TreeNode node, StringBuilder sb) {
        if (sb.length() > 0) sb.append(',');
        if (node == null) {
            sb.append('#');
            return;
        }
        sb.append(node.val);
        walk(node.left, sb);
        walk(node.right, sb);
    }

    public TreeNode deserialize(String data) {
        String[] tokens = data.split(",");
        int[] pos = {0};
        return build(tokens, pos);
    }

    private TreeNode build(String[] tokens, int[] pos) {
        String token = tokens[pos[0]++];
        if (token.equals("#")) return null;
        TreeNode node = new TreeNode(Integer.parseInt(token));
        // Pre-order: the whole left subtree comes before the right one.
        node.left = build(tokens, pos);
        node.right = build(tokens, pos);
        return node;
    }
}
