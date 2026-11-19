// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0336.Palindrome%20Pairs/Solution.cs
// O(n * k^2): split every word w = prefix + suffix at every position. If the suffix is a
// palindrome, the partner on the right must be exactly reverse(prefix); if the prefix is a
// palindrome, the partner on the left must be exactly reverse(suffix). Indexing the words by their
// reverse finds either in O(k), without reversing anything per split.
function palindromeJoins(words: string[]): number[][] {
  const isPalindrome = (s: string, lo: number, hi: number): boolean => {
    while (lo < hi) if (s[lo++] !== s[hi--]) return false;
    return true;
  };
  const byReverse = new Map<string, number>(words.map((w, i) => [w.split('').reverse().join(''), i]));
  const ans: number[][] = [];
  words.forEach((w, i) => {
    const m = w.length;
    for (let j = 0; j <= m; j++) {
      // j > 0: an empty prefix would find the same equal-length mirror pair a second time.
      if (j > 0 && isPalindrome(w, 0, j - 1)) {
        const left = byReverse.get(w.slice(j));
        if (left !== undefined && left !== i) ans.push([left, i]);
      }
      // The cheap palindrome check runs first: it usually fails within a letter or two.
      if (isPalindrome(w, j, m - 1)) {
        const right = byReverse.get(w.slice(0, j));
        if (right !== undefined && right !== i) ans.push([i, right]);
      }
    }
  });
  return ans.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
}
