// O(m * n) time - long multiplication, digit by digit.
function multiply(num1: string, num2: string): string {
  if (num1 === '0' || num2 === '0') return '0';
  const m = num1.length;
  const n = num2.length;
  // Digit i of num1 times digit j of num2 contributes to position i + j + 1 (0 = most significant).
  const pos: number[] = new Array(m + n).fill(0);
  for (let i = m - 1; i >= 0; i--) {
    const da = num1.charCodeAt(i) - 48;
    let carry = 0;
    for (let j = n - 1; j >= 0; j--) {
      const total = pos[i + j + 1] + da * (num2.charCodeAt(j) - 48) + carry;
      pos[i + j + 1] = total % 10;
      carry = Math.floor(total / 10);
    }
    // Everything right of position i has been settled; the leftover carry lands at i.
    pos[i] += carry;
  }
  // The product has m + n or m + n - 1 digits; only the first one can be a zero.
  return (pos[0] === 0 ? pos.slice(1) : pos).join('');
}
