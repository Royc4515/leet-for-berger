// O(n * L) hash lookups for text length n and longest word L: reach[i] says the first i
// characters split cleanly.
function canSplit(text: string, words: string[]): boolean {
  const dictionary = new Set<string>(words);
  // Only lengths that occur in the dictionary can end a piece, so at most 20 probes per position.
  const lengths = [...new Set(words.map((w) => w.length))].sort((a, b) => a - b);
  const n = text.length;
  const reach: boolean[] = new Array(n + 1).fill(false);
  reach[0] = true;
  for (let i = 1; i <= n; i++) {
    for (const length of lengths) {
      if (length > i) break;
      if (reach[i - length] && dictionary.has(text.slice(i - length, i))) {
        reach[i] = true;
        break;
      }
    }
  }
  return reach[n];
}
