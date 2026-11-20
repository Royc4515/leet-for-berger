class Solution {
    // O(n) time, O(1) space: the counter is the number of brackets open right now.
    public int maxParenDepth(String s) {
        int depth = 0;
        int best = 0;
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            if (ch == '(') {
                depth++;
                // A new peak can only appear right after an opening bracket.
                best = Math.max(best, depth);
            } else if (ch == ')') {
                depth--;
            }
        }
        return best;
    }
}
