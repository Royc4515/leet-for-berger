using System.Globalization;
using System.Text;

public class Codec {
    // Pre-order with "#" for missing children: O(n) per call. The token position is a local,
    // never a field, so every deserialize call starts from the beginning.

    public Codec() {
    }

    public string Serialize(TreeNode root) {
        // A StringBuilder keeps this linear; string += would copy the text for every node.
        var sb = new StringBuilder();
        Walk(root, sb);
        return sb.ToString();
    }

    private static void Walk(TreeNode node, StringBuilder sb) {
        if (sb.Length > 0) sb.Append(',');
        if (node == null) {
            sb.Append('#');
            return;
        }
        sb.Append(node.val.ToString(CultureInfo.InvariantCulture));
        Walk(node.left, sb);
        Walk(node.right, sb);
    }

    public TreeNode Deserialize(string data) {
        string[] tokens = data.Split(',');
        int pos = 0;
        return Build(tokens, ref pos);
    }

    private static TreeNode Build(string[] tokens, ref int pos) {
        string token = tokens[pos++];
        if (token == "#") return null;
        var node = new TreeNode(int.Parse(token, CultureInfo.InvariantCulture));
        // Pre-order: the whole left subtree comes before the right one.
        node.left = Build(tokens, ref pos);
        node.right = Build(tokens, ref pos);
        return node;
    }
}
