public class Solution {
    // O(n) time - operands wait on a stack; each operator combines the two most recent values.
    public int EvalPostfix(string[] tokens) {
        var stack = new Stack<int>();
        foreach (var t in tokens) {
            // Compare whole tokens, not t[0]: "-3" is a number, not a minus sign.
            if (t == "+" || t == "-" || t == "*" || t == "/") {
                int b = stack.Pop(); // the right operand was pushed last
                int a = stack.Pop();
                stack.Push(t switch {
                    "+" => a + b,
                    "-" => a - b,
                    "*" => a * b,
                    _ => a / b, // C# int division already truncates toward zero
                });
            } else {
                stack.Push(int.Parse(t));
            }
        }
        return stack.Pop();
    }
}
