public class Solution {
    // O(C * n) time for C answers: every path of the search is a valid prefix, so nothing is wasted.
    public string[] BalancedPairs(int n, int maxDepth) {
        var result = new List<string>();
        Dfs(new System.Text.StringBuilder(), 0, 0, n, maxDepth, result);
        return result.ToArray();
    }

    private void Dfs(System.Text.StringBuilder path, int opened, int closed, int n, int maxDepth, List<string> result) {
        if (path.Length == 2 * n) {
            result.Add(path.ToString());
            return;
        }
        // Open while pairs remain and the depth (opened - closed) is under the limit.
        // "(" is tried first because it sorts before ")", which keeps the output in order.
        if (opened < n && opened - closed < maxDepth) {
            path.Append('(');
            Dfs(path, opened + 1, closed, n, maxDepth, result);
            path.Length--;
        }
        // Close only while something is open.
        if (closed < opened) {
            path.Append(')');
            Dfs(path, opened, closed + 1, n, maxDepth, result);
            path.Length--;
        }
    }
}
