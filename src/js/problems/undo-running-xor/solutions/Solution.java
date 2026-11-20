class Solution {
    // O(n) time - pref[i] ^ pref[i - 1] cancels every element before i and leaves arr[i].
    public int[] undoRunningXor(int[] pref) {
        int[] arr = new int[pref.length];
        arr[0] = pref[0];
        for (int i = 1; i < pref.length; i++) {
            arr[i] = pref[i] ^ pref[i - 1];
        }
        return arr;
    }
}
