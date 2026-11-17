// O(log10 x) time - reverse only the lower half of the digits.
function isPalindrome(x: number): boolean {
  // A trailing zero would need a leading zero to match; only 0 itself qualifies.
  if (x < 0 || (x % 10 === 0 && x !== 0)) return false;
  let half = 0;
  while (x > half) {
    half = half * 10 + (x % 10);
    x = Math.floor(x / 10);
  }
  // Odd digit count: the middle digit ended up in half, so drop it before comparing.
  return x === half || x === Math.floor(half / 10);
}
