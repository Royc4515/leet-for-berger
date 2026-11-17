// O(n + m) - Knuth-Morris-Pratt. fail[i] is the length of the longest proper prefix of
// needle[0..i] that is also its suffix: after a mismatch, that much is already matched.
function firstMatchIndex(haystack: string, needle: string): number {
  const m = needle.length;
  const fail = new Int32Array(m);
  for (let i = 1, k = 0; i < m; i++) {
    while (k > 0 && needle[i] !== needle[k]) k = fail[k - 1];
    if (needle[i] === needle[k]) k++;
    fail[i] = k;
  }
  // k counts needle characters matched so far; the text pointer never moves back.
  for (let i = 0, k = 0; i < haystack.length; i++) {
    while (k > 0 && haystack[i] !== needle[k]) k = fail[k - 1];
    if (haystack[i] === needle[k]) k++;
    if (k === m) return i - m + 1;
  }
  return -1;
}
