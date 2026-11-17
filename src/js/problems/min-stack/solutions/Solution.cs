// O(1) per operation: every entry remembers the minimum of the stack up to and including it.
public class MinStack {
    private readonly Stack<(int Val, int Min)> stack = new Stack<(int, int)>();

    public MinStack() {
    }

    public void Push(int val) {
        // The minimum below an entry never changes while that entry sits on the stack.
        int min = stack.Count == 0 ? val : Math.Min(val, stack.Peek().Min);
        stack.Push((val, min));
    }

    public void Pop() {
        stack.Pop();
    }

    public int Top() {
        return stack.Peek().Val;
    }

    public int GetMin() {
        return stack.Peek().Min;
    }
}
