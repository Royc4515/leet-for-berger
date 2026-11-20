class Solution {
public:
    // O(C * n) time for C answers: every path of the search is a valid prefix, so nothing is wasted.
    vector<string> balancedPairs(int n, int maxDepth) {
        vector<string> out;
        string path;
        dfs(path, 0, 0, n, maxDepth, out);
        return out;
    }

private:
    void dfs(string& path, int opened, int closed, int n, int maxDepth, vector<string>& out) {
        if ((int)path.size() == 2 * n) {
            out.push_back(path);
            return;
        }
        // Open while pairs remain and the depth (opened - closed) is under the limit.
        // "(" is tried first because it sorts before ")", which keeps the output in order.
        if (opened < n && opened - closed < maxDepth) {
            path.push_back('(');
            dfs(path, opened + 1, closed, n, maxDepth, out);
            path.pop_back();
        }
        // Close only while something is open.
        if (closed < opened) {
            path.push_back(')');
            dfs(path, opened, closed + 1, n, maxDepth, out);
            path.pop_back();
        }
    }
};
