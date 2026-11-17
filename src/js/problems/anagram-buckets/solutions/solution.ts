// O(n * k log k) time - the sorted letters are the same key for every anagram.
function groupAnagrams(words: string[]): string[][] {
  // Map keeps insertion order, which gives first-appearance group order for free.
  const groups = new Map<string, string[]>();
  for (const w of words) {
    const key = [...w].sort().join('');
    const group = groups.get(key);
    if (group) group.push(w);
    else groups.set(key, [w]);
  }
  return [...groups.values()];
}
