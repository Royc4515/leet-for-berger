// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0127.Word%20Ladder/Solution.ts
// O(N * L * 26) word generations - BFS level by level; neighbours come from trying every
// letter at every position and checking the set, never from comparing all pairs of words.
function ladderLength(beginWord: string, endWord: string, wordList: string[]): number {
  const words = new Set(wordList);
  if (!words.has(endWord)) return 0;
  // Removing a word when it is queued doubles as the visited mark.
  words.delete(beginWord);
  let q: string[] = [beginWord];
  let ans = 1;
  while (q.length) {
    ans++;
    const next: string[] = [];
    for (const s of q) {
      for (let i = 0; i < s.length; i++) {
        // Slicing once per position is cheaper than rebuilding the word per letter.
        const head = s.slice(0, i);
        const tail = s.slice(i + 1);
        for (let j = 0; j < 26; j++) {
          const t = head + String.fromCharCode(97 + j) + tail;
          if (!words.has(t)) continue;
          if (t === endWord) return ans;
          next.push(t);
          words.delete(t);
        }
      }
    }
    q = next;
  }
  return 0;
}
