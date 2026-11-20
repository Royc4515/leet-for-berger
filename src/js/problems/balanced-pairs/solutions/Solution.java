import java.util.*;

class Solution {
    // O(C * n) time for C answers: every path of the search is a valid prefix, so nothing is wasted.
    public String[] balancedPairs(int n, int maxDepth) {
        List<String> out = new ArrayList<>();
        dfs(new StringBuilder(), 0, 0, n, maxDepth, out);
        return out.toArray(new String[0]);
    }

    private void dfs(StringBuilder path, int opened, int closed, int n, int maxDepth, List<String> out) {
        if (path.length() == 2 * n) {
            out.add(path.toString());
            return;
        }
        // Open while pairs remain and the depth (opened - closed) is under the limit.
        // "(" is tried first because it sorts before ")", which keeps the output in order.
        if (opened < n && opened - closed < maxDepth) {
            path.append('(');
            dfs(path, opened + 1, closed, n, maxDepth, out);
            path.deleteCharAt(path.length() - 1);
        }
        // Close only while something is open.
        if (closed < opened) {
            path.append(')');
            dfs(path, opened, closed + 1, n, maxDepth, out);
            path.deleteCharAt(path.length() - 1);
        }
    }
}
