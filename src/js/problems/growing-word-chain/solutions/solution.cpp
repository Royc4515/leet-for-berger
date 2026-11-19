class Solution {
public:
    // O(n * L^2) time, O(n * L) space. Short words first, so every predecessor (one letter
    // shorter) already holds its final chain length when a word looks it up.
    int longestChain(vector<string>& words) {
        vector<string> sorted = words;
        stable_sort(sorted.begin(), sorted.end(), [](const string& a, const string& b) { return a.size() < b.size(); });
        unordered_map<string, int> best;
        best.reserve(sorted.size() * 2);
        int answer = 0;
        for (const string& w : sorted) {
            // Deleting one letter lists every word that can grow into w: at most L lookups, no pair scan.
            int here = 1;
            for (size_t i = 0; i < w.size(); i++) {
                string prev = w.substr(0, i) + w.substr(i + 1);
                auto it = best.find(prev);
                if (it != best.end()) here = max(here, it->second + 1);
            }
            best[w] = here;
            answer = max(answer, here);
        }
        return answer;
    }
};
