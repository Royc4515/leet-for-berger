class Solution {
public:
    // O(n) time - the most recently opened bracket must close first, so keep openers on a stack.
    bool isValid(string s) {
        string stack;
        for (char ch : s) {
            if (ch == '(' || ch == '[' || ch == '{') {
                stack.push_back(ch);
            } else {
                char want = ch == ')' ? '(' : ch == ']' ? '[' : '{';
                // An empty stack means a closer with nothing open.
                if (stack.empty() || stack.back() != want) return false;
                stack.pop_back();
            }
        }
        // Leftover openers were never closed.
        return stack.empty();
    }
};
