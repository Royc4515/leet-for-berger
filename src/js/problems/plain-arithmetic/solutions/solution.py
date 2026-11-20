def evaluate(s: str) -> int:
    # O(n) time, O(1) space: `total` holds the finished terms, `last` the open term (signed).
    total, last, num, op = 0, 0, 0, '+'
    n = len(s)
    for i, c in enumerate(s):
        if c.isdigit():
            num = num * 10 + int(c)
        # An operator ends the number before it; the end of the text ends the last one, even when
        # it is followed by spaces.
        if (c != ' ' and not c.isdigit()) or i == n - 1:
            if op == '+':
                total += last
                last = num
            elif op == '-':
                total += last
                last = -num
            elif op == '*':
                last *= num
            else:
                # Truncate toward zero: // would floor, and `last` is negative after a minus sign
                # (1-5/2 must divide -5 by 2 to get -2, not -3).
                last = -(-last // num) if last < 0 else last // num
            op = c
            num = 0
    return total + last
