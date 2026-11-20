class Solution {
public:
    // O(n * L) hash lookups for text length n and longest word L: reach[i] says the first i
    // characters split cleanly.
    bool canSplit(string& text, vector<string>& words) {
        unordered_set<string> dictionary(words.begin(), words.end());
        // Only lengths that occur in the dictionary can end a piece, so at most 20 probes per position.
        set<int> lengths;
        for (const string& w : words) {
            lengths.insert((int)w.size());
        }
        int n = text.size();
        vector<bool> reach(n + 1, false);
        reach[0] = true;
        for (int i = 1; i <= n; i++) {
            for (int length : lengths) {
                if (length > i) {
                    break;
                }
                if (reach[i - length] && dictionary.count(text.substr(i - length, length))) {
                    reach[i] = true;
                    break;
                }
            }
        }
        return reach[n];
    }
};
