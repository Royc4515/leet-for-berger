class Solution {
public:
    // O(n + m) time: alternate while both words have letters, then copy the longer word's tail.
    string interleaveWords(string word1, string word2) {
        string out;
        // The final length is known, so the string never has to grow.
        out.reserve(word1.size() + word2.size());
        size_t common = min(word1.size(), word2.size());
        for (size_t i = 0; i < common; i++) {
            out += word1[i];
            out += word2[i];
        }
        // Only one of these tails is non-empty.
        out.append(word1, common, string::npos);
        out.append(word2, common, string::npos);
        return out;
    }
};
