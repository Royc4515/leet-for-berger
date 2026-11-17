// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0068.Text%20Justification/Solution.ts
// O(total output) - greedy packing, then spacing rules per line.
function justifyText(words: string[], maxWidth: number): string[] {
  const ans: string[] = [];
  for (let i = 0, n = words.length; i < n; ) {
    // cnt is the line's width with single gaps; take words while that still fits.
    const t: string[] = [words[i]];
    let cnt = words[i++].length;
    while (i < n && cnt + 1 + words[i].length <= maxWidth) {
      cnt += 1 + words[i].length;
      t.push(words[i++]);
    }
    // The last line and one-word lines are left-aligned (a one-word line has no gap to widen).
    if (i === n || t.length === 1) {
      const left = t.join(' ');
      ans.push(left + ' '.repeat(maxWidth - left.length));
      continue;
    }
    const gaps = t.length - 1;
    const spaceWidth = maxWidth - (cnt - gaps);
    // Leftmost gaps take the remainder, one extra space each.
    const w = Math.floor(spaceWidth / gaps);
    const m = spaceWidth % gaps;
    let row = '';
    for (let j = 0; j < gaps; j++) row += t[j] + ' '.repeat(w + (j < m ? 1 : 0));
    ans.push(row + t[gaps]);
  }
  return ans;
}
