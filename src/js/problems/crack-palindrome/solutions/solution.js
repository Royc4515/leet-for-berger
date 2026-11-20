/**
 * O(n) time. Lower the earliest letter that is not 'a'; if the whole first half is 'a', raise the
 * last letter to 'b' instead.
 * @param {string} palindrome
 * @return {string}
 */
function crackPalindrome(palindrome) {
  const n = palindrome.length;
  if (n < 2) return '';
  // Only the first half: the middle of an odd palindrome mirrors itself, so lowering it keeps the
  // string a palindrome ("aba" -> "aaa").
  for (let i = 0; i < Math.floor(n / 2); i++) {
    if (palindrome[i] !== 'a') return palindrome.slice(0, i) + 'a' + palindrome.slice(i + 1);
  }
  return palindrome.slice(0, n - 1) + 'b';
}
