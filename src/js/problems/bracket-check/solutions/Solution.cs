public class Solution {
    // O(n) time - the most recently opened bracket must close first, so keep openers on a stack.
    public bool IsValid(string s) {
        var stack = new Stack<char>();
        foreach (char ch in s) {
            if (ch == '(' || ch == '[' || ch == '{') {
                stack.Push(ch);
            } else {
                char want = ch == ')' ? '(' : ch == ']' ? '[' : '{';
                // An empty stack means a closer with nothing open.
                if (stack.Count == 0 || stack.Pop() != want) return false;
            }
        }
        // Leftover openers were never closed.
        return stack.Count == 0;
    }
}
