/**
 * O(n) time - pref[i] ^ pref[i - 1] cancels every element before i and leaves arr[i].
 * @param {number[]} pref
 * @return {number[]}
 */
function undoRunningXor(pref) {
  const arr = [pref[0]];
  for (let i = 1; i < pref.length; i++) arr.push(pref[i] ^ pref[i - 1]);
  return arr;
}
