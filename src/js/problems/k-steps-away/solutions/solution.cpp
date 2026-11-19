// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0800-0899/0863.All%20Nodes%20Distance%20K%20in%20Binary%20Tree/Solution.cpp
class Solution {
public:
    // O(n + m log m): nodes only point down, so record every parent first; then the tree is an
    // undirected graph and k rounds of breadth-first search from the target reach exactly distance k.
    vector<int> kStepsAway(TreeNode* root, int target, int k) {
        unordered_map<TreeNode*, TreeNode*> parent{{root, nullptr}};
        TreeNode* start = root;
        vector<TreeNode*> queue{root};
        for (size_t h = 0; h < queue.size(); ++h) {
            TreeNode* node = queue[h];
            if (node->val == target) start = node;
            for (TreeNode* child : {node->left, node->right}) {
                if (child) {
                    parent[child] = node;
                    queue.push_back(child);
                }
            }
        }
        // The seen set stops the search from stepping back to where it came from.
        unordered_set<TreeNode*> seen{start};
        vector<TreeNode*> frontier{start};
        for (int step = 0; step < k && !frontier.empty(); ++step) {
            vector<TreeNode*> next;
            for (TreeNode* node : frontier) {
                for (TreeNode* nb : {node->left, node->right, parent[node]}) {
                    if (nb && seen.insert(nb).second) next.push_back(nb);
                }
            }
            frontier = move(next);
        }
        vector<int> out;
        for (TreeNode* node : frontier) out.push_back(node->val);
        sort(out.begin(), out.end());
        return out;
    }
};
