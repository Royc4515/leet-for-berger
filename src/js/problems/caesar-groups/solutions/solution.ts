// O(n * k) time: every word is normalized once, then grouped by that key.
function groupByShift(words: string[]): string[][] {
  // Map keeps insertion order, which gives first-appearance group order.
  const groups = new Map<string, string[]>();
  for (const w of words) {
    const diff = w.charCodeAt(0) - 97;
    let key = '';
    for (let i = 0; i < w.length; i++) {
      // Shift back so the word starts with "a"; + 26 keeps wrapped letters non-negative.
      key += String.fromCharCode(97 + ((w.charCodeAt(i) - 97 - diff + 26) % 26));
    }
    const group = groups.get(key);
    if (group) group.push(w);
    else groups.set(key, [w]);
  }
  return [...groups.values()];
}
