// O(n) - Manacher's algorithm. d1[i] is the radius of the longest odd palindrome centered at i,
// d2[i] that of the longest even one whose right middle is i. Inside the rightmost palindrome
// found so far [l, r], the mirror position gives a radius for free.
function widestPalindrome(s: string): string {
  const n = s.length;
  let bestLen = 0;
  let bestStart = 0;
  // Ties go to the leftmost start, whichever order the candidates arrive in.
  const consider = (len: number, start: number): void => {
    if (len > bestLen || (len === bestLen && start < bestStart)) {
      bestLen = len;
      bestStart = start;
    }
  };

  const d1 = new Int32Array(n);
  for (let i = 0, l = 0, r = -1; i < n; i++) {
    let k = i > r ? 1 : Math.min(d1[l + r - i], r - i + 1);
    while (i - k >= 0 && i + k < n && s[i - k] === s[i + k]) k++;
    d1[i] = k;
    if (i + k - 1 > r) {
      l = i - k + 1;
      r = i + k - 1;
    }
    consider(2 * k - 1, i - k + 1);
  }

  const d2 = new Int32Array(n);
  for (let i = 0, l = 0, r = -1; i < n; i++) {
    let k = i > r ? 0 : Math.min(d2[l + r - i + 1], r - i + 1);
    while (i - k - 1 >= 0 && i + k < n && s[i - k - 1] === s[i + k]) k++;
    d2[i] = k;
    if (i + k - 1 > r) {
      l = i - k;
      r = i + k - 1;
    }
    if (k > 0) consider(2 * k, i - k);
  }

  return s.slice(bestStart, bestStart + bestLen);
}
