class Solution {
    // O(n) time - the most recently opened bracket must close first, so keep openers on a stack.
    public boolean isValid(String s) {
        // A char array used as a stack avoids boxing every bracket into a Character.
        char[] stack = new char[s.length()];
        int top = 0;
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            if (ch == '(' || ch == '[' || ch == '{') {
                stack[top++] = ch;
            } else {
                char want = ch == ')' ? '(' : ch == ']' ? '[' : '{';
                // top == 0 means a closer with nothing open.
                if (top == 0 || stack[--top] != want) return false;
            }
        }
        // Leftover openers were never closed.
        return top == 0;
    }
}
