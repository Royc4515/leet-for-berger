// O(n) time, O(1) space: `total` holds the finished terms, `last` the open term (signed).
class Solution {
    public int evaluate(String s) {
        int total = 0;
        int last = 0;
        int num = 0;
        char op = '+';
        int n = s.length();
        for (int i = 0; i < n; i++) {
            char c = s.charAt(i);
            boolean isDigit = c >= '0' && c <= '9';
            if (isDigit) num = num * 10 + (c - '0');
            // An operator ends the number before it; the end of the text ends the last one, even
            // when it is followed by spaces.
            if ((c != ' ' && !isDigit) || i == n - 1) {
                if (op == '+') {
                    total += last;
                    last = num;
                } else if (op == '-') {
                    total += last;
                    last = -num;
                } else if (op == '*') {
                    last *= num;
                } else {
                    // Java's / truncates toward zero, which is what a negative `last` needs.
                    last /= num;
                }
                op = c;
                num = 0;
            }
        }
        return total + last;
    }
}
