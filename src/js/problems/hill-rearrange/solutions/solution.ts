// O(n^2) worst case (a deeply nested hill re-slices and sorts at every level).
// Cut into top-level hills, rearrange inside each, then place the pieces largest first.
function rearrangeHills(s: string): string {
  const pieces: string[] = [];
  let height = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    height += s[i] === '1' ? 1 : -1;
    if (height === 0) {
      // A piece is "1" + hill + "0": strip the outer pair before recursing, or the recursion
      // would never get smaller.
      pieces.push('1' + rearrangeHills(s.slice(start + 1, i)) + '0');
      start = i + 1;
    }
  }
  // No piece is a prefix of another, so plain descending text order is the best concatenation.
  pieces.sort().reverse();
  return pieces.join('');
}
