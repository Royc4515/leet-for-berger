public class Solution {
    // O(n) time, O(1) space: the counter is the number of brackets open right now.
    public int MaxParenDepth(string s) {
        int depth = 0, best = 0;
        foreach (char ch in s) {
            if (ch == '(') {
                depth++;
                // A new peak can only appear right after an opening bracket.
                if (depth > best) best = depth;
            } else if (ch == ')') {
                depth--;
            }
        }
        return best;
    }
}
