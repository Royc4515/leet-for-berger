/**
 * O(n * k log k) time - the sorted letters are the same key for every anagram.
 * @param {string[]} words
 * @return {string[][]}
 */
function groupAnagrams(words) {
  // Map keeps insertion order, which gives first-appearance group order for free.
  const groups = new Map();
  for (const w of words) {
    const key = [...w].sort().join('');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(w);
  }
  return [...groups.values()];
}
