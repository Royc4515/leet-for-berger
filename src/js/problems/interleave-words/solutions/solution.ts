// O(n + m) time: alternate while both words have letters, then copy the longer word's tail.
// Letters go into an array and are joined once, so no intermediate string is copied.
function interleaveWords(word1: string, word2: string): string {
  const out: string[] = [];
  const common = Math.min(word1.length, word2.length);
  for (let i = 0; i < common; i++) {
    out.push(word1[i], word2[i]);
  }
  // Only one of these slices is non-empty.
  out.push(word1.slice(common), word2.slice(common));
  return out.join('');
}
