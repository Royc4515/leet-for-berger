// O(n) time - pref[i] ^ pref[i - 1] cancels every element before i and leaves arr[i].
function undoRunningXor(pref: number[]): number[] {
  const arr: number[] = [pref[0]];
  for (let i = 1; i < pref.length; i++) arr.push(pref[i] ^ pref[i - 1]);
  return arr;
}
