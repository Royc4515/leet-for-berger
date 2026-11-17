import java.util.*;

// O(1) per operation: every entry remembers the minimum of the stack up to and including it.
class MinStack {
    private final Deque<int[]> stack = new ArrayDeque<>();

    public MinStack() {
    }

    public void push(int val) {
        // The minimum below an entry never changes while that entry sits on the stack.
        int min = stack.isEmpty() ? val : Math.min(val, stack.peek()[1]);
        stack.push(new int[] { val, min });
    }

    public void pop() {
        stack.pop();
    }

    public int top() {
        return stack.peek()[0];
    }

    public int getMin() {
        return stack.peek()[1];
    }
}
