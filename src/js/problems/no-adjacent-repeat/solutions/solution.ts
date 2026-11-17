// O(26 * n) time - greedy left to right. With m letters still to place, a letter occurring more
// than floor(m / 2) times must go next; otherwise the smallest letter that differs from the
// previous one keeps the rest arrangeable.
function reorganizeString(s: string): string {
  const n = s.length;
  const cnt = new Array<number>(26).fill(0);
  for (let i = 0; i < n; i++) cnt[s.charCodeAt(i) - 97]++;
  // Beyond ceil(n / 2) copies, two of them must touch.
  if (Math.max(...cnt) > Math.ceil(n / 2)) return '';
  const out: string[] = [];
  let prev = -1;
  for (let m = n; m > 0; m--) {
    let pick = -1;
    // At most one letter can exceed half of what is left, so the first hit is the only one.
    for (let c = 0; c < 26 && pick < 0; c++) if (2 * cnt[c] > m) pick = c;
    for (let c = 0; c < 26 && pick < 0; c++) if (cnt[c] > 0 && c !== prev) pick = c;
    cnt[pick]--;
    out.push(String.fromCharCode(97 + pick));
    prev = pick;
  }
  return out.join('');
}
