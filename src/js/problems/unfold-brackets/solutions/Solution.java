import java.util.*;

class Solution {
    // O(n + m) time for input length n and output length m: one shared buffer, and a closing
    // bracket repeats only the slice written since its opening bracket.
    public String unfoldBrackets(String s) {
        StringBuilder out = new StringBuilder();
        Deque<int[]> stack = new ArrayDeque<>(); // {where the group starts in out, repeat count}
        int k = 0;
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            if (Character.isDigit(ch)) {
                // Counts can have several digits.
                k = k * 10 + (ch - '0');
            } else if (ch == '[') {
                stack.push(new int[] {out.length(), k});
                k = 0;
            } else if (ch == ']') {
                int[] top = stack.pop();
                // The group is already in the buffer once, so add count - 1 more copies.
                String group = out.substring(top[0]);
                for (int t = 1; t < top[1]; t++) out.append(group);
            } else {
                out.append(ch);
            }
        }
        return out.toString();
    }
}
