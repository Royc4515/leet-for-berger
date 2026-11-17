// O(total length) - vertical scan: column i of every word, stopping at the first mismatch.
function longestCommonPrefix(strs: string[]): string {
  const first = strs[0];
  for (let i = 0; i < first.length; i++) {
    for (let j = 1; j < strs.length; j++) {
      // Check the length first: a shorter word has run out, so the prefix ends here.
      if (i >= strs[j].length || strs[j][i] !== first[i]) return first.substring(0, i);
    }
  }
  return first;
}
