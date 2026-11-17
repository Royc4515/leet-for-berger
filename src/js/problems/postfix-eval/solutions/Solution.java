class Solution {
    // O(n) time - operands wait on a stack; each operator combines the two most recent values.
    public int evalPostfix(String[] tokens) {
        // An int array with a top index is a stack without boxing every value.
        int[] stack = new int[tokens.length];
        int top = 0;
        for (String t : tokens) {
            // Compare whole tokens, not the first character: "-3" is a number, not a minus sign.
            if (t.length() == 1 && "+-*/".indexOf(t.charAt(0)) >= 0) {
                int b = stack[--top]; // the right operand was pushed last
                int a = stack[--top];
                switch (t.charAt(0)) {
                    case '+': stack[top++] = a + b; break;
                    case '-': stack[top++] = a - b; break;
                    case '*': stack[top++] = a * b; break;
                    default: stack[top++] = a / b; // Java int division already truncates toward zero
                }
            } else {
                stack[top++] = Integer.parseInt(t);
            }
        }
        return stack[0];
    }
}
