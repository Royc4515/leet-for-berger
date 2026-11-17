class Codec {
public:
    // Pre-order with "#" for missing children: O(n) per call. The read position is a local,
    // never a member, so every deserialize call starts from the beginning.
    Codec() {
    }

    string serialize(TreeNode* root) {
        string out;
        walk(root, out);
        return out;
    }

    TreeNode* deserialize(string data) {
        size_t pos = 0;
        return build(data, pos);
    }

private:
    void walk(TreeNode* node, string& out) {
        if (!out.empty()) out += ',';
        if (!node) {
            out += '#';
            return;
        }
        out += to_string(node->val);
        walk(node->left, out);
        walk(node->right, out);
    }

    TreeNode* build(const string& data, size_t& pos) {
        // Each token ends at the next comma or at the end of the string.
        size_t end = data.find(',', pos);
        if (end == string::npos) end = data.size();
        string token = data.substr(pos, end - pos);
        pos = end + 1;
        if (token == "#") return nullptr;
        TreeNode* node = new TreeNode(stoi(token));
        // Pre-order: the whole left subtree comes before the right one.
        node->left = build(data, pos);
        node->right = build(data, pos);
        return node;
    }
};
