class Solution {
public:
    // O(n) time, O(1) space: the counter is the number of brackets open right now.
    int maxParenDepth(string s) {
        int depth = 0, best = 0;
        for (char ch : s) {
            if (ch == '(') {
                depth++;
                // A new peak can only appear right after an opening bracket.
                best = max(best, depth);
            } else if (ch == ')') {
                depth--;
            }
        }
        return best;
    }
};
