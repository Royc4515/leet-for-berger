// O(n) time, O(1) space: one scan, and the magnitude stops growing once it passes 2^31.
function textToInt(s: string): number {
  const n = s.length;
  let i = 0;
  while (i < n && s[i] === ' ') i++;
  let sign = 1;
  if (s[i] === '+' || s[i] === '-') {
    if (s[i] === '-') sign = -1;
    i++;
  }
  let magnitude = 0;
  while (i < n && s[i] >= '0' && s[i] <= '9') {
    magnitude = magnitude * 10 + (s.charCodeAt(i) - 48);
    // Digits only make it larger, so the answer is already a bound. Stopping here also keeps a
    // 100,000-digit run from becoming a float that has lost its digits.
    if (magnitude > 2147483648) break;
    i++;
  }
  // The + 0 turns -0 (from "-0") into 0.
  return Math.max(-2147483648, Math.min(2147483647, sign * magnitude)) + 0;
}
