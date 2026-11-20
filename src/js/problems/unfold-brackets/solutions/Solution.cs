public class Solution {
    // O(n + m) time for input length n and output length m: one shared buffer, and a closing
    // bracket repeats only the slice written since its opening bracket.
    public string UnfoldBrackets(string s) {
        var outBuf = new System.Text.StringBuilder();
        var stack = new Stack<(int start, int times)>();
        int k = 0;
        foreach (char ch in s) {
            if (ch >= '0' && ch <= '9') {
                // Counts can have several digits.
                k = k * 10 + (ch - '0');
            } else if (ch == '[') {
                stack.Push((outBuf.Length, k));
                k = 0;
            } else if (ch == ']') {
                var (start, times) = stack.Pop();
                // The group is already in the buffer once, so add times - 1 more copies.
                string group = outBuf.ToString(start, outBuf.Length - start);
                for (int t = 1; t < times; t++) outBuf.Append(group);
            } else {
                outBuf.Append(ch);
            }
        }
        return outBuf.ToString();
    }
}
