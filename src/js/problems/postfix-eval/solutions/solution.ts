// O(n) time - operands wait on a stack; each operator combines the two most recent values.
function evalPostfix(tokens: string[]): number {
  const stack: number[] = [];
  for (const t of tokens) {
    // Compare whole tokens, not t[0]: "-3" is a number, not a minus sign.
    if (t === '+' || t === '-' || t === '*' || t === '/') {
      const b = stack.pop()!; // the right operand was pushed last
      const a = stack.pop()!;
      if (t === '+') stack.push(a + b);
      else if (t === '-') stack.push(a - b);
      else if (t === '*') stack.push(a * b);
      // Math.trunc rounds toward zero; | 0 then turns the -0 that -1 / 3 gives into 0.
      else stack.push(Math.trunc(a / b) | 0);
    } else {
      stack.push(Number(t));
    }
  }
  return stack[0];
}
