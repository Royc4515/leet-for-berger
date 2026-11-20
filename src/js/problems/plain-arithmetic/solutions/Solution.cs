// O(n) time, O(1) space: `total` holds the finished terms, `last` the open term (signed).
public class Solution {
    public int Evaluate(string s) {
        int total = 0, last = 0, num = 0;
        char op = '+';
        int n = s.Length;
        for (int i = 0; i < n; i++) {
            char c = s[i];
            bool isDigit = c >= '0' && c <= '9';
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
                    // C# integer division truncates toward zero, which a negative `last` needs.
                    last /= num;
                }
                op = c;
                num = 0;
            }
        }
        return total + last;
    }
}
