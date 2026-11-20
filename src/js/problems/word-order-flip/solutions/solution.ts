// O(n) time: walk from the right end so the words come out already in reverse order. Skipping
// every space before a word drops leading, trailing and repeated spaces in one move.
function flipWordOrder(s: string): string {
  const words: string[] = [];
  let i = s.length - 1;
  while (i >= 0) {
    while (i >= 0 && s[i] === ' ') i--;
    if (i < 0) break;
    const end = i;
    while (i >= 0 && s[i] !== ' ') i--;
    words.push(s.slice(i + 1, end + 1));
  }
  // One join at the end: the output is built once instead of copied per word.
  return words.join(' ');
}
