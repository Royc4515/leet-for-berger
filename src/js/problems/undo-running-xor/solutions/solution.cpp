class Solution {
public:
    // O(n) time - pref[i] ^ pref[i - 1] cancels every element before i and leaves arr[i].
    vector<int> undoRunningXor(vector<int>& pref) {
        vector<int> arr(pref.size());
        arr[0] = pref[0];
        for (size_t i = 1; i < pref.size(); i++) {
            arr[i] = pref[i] ^ pref[i - 1];
        }
        return arr;
    }
};
