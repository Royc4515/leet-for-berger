// O(n) time, O(1) space: `total` holds the finished terms, `last` the open term (signed).
function evaluate(s: string): number {
  let total = 0;
  let last = 0;
  let num = 0;
  let op = '+';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const isDigit = c >= '0' && c <= '9';
    if (isDigit) num = num * 10 + (c.charCodeAt(0) - 48);
    // An operator ends the number before it; the end of the text ends the last one, even when it
    // is followed by spaces.
    if ((c !== ' ' && !isDigit) || i === s.length - 1) {
      if (op === '+') {
        total += last;
        last = num;
      } else if (op === '-') {
        total += last;
        last = -num;
      } else if (op === '*') {
        last *= num;
      } else {
        // `last` is negative after a minus sign, and / must truncate toward zero (1-5/2 divides -5
        // by 2 to get -2), which Math.floor would not do.
        last = Math.trunc(last / num);
      }
      op = c;
      num = 0;
    }
  }
  return total + last;
}
