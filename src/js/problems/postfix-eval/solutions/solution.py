def eval_postfix(tokens: list[str]) -> int:
    # O(n) time - operands wait on a stack; each operator combines the two most recent values.
    stack = []
    for t in tokens:
        # Compare against the operator set, not t[0]: "-3" is a number, not a minus sign.
        if t in ('+', '-', '*', '/'):
            b = stack.pop()  # the right operand was pushed last
            a = stack.pop()
            if t == '+':
                stack.append(a + b)
            elif t == '-':
                stack.append(a - b)
            elif t == '*':
                stack.append(a * b)
            else:
                # // floors (-7 // 2 == -4); divide the magnitudes and restore the sign to
                # truncate toward zero instead.
                q = abs(a) // abs(b)
                stack.append(q if (a < 0) == (b < 0) else -q)
        else:
            stack.append(int(t))
    return stack[0]
