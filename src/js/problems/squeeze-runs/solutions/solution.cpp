class Solution {
public:
    // O(n) time. i marks the start of a run, j walks to its end; the next run starts at j, so the
    // last run needs no separate flush.
    string squeezeRuns(string s) {
        string out;
        int n = (int)s.size();
        int i = 0;
        while (i < n) {
            int j = i;
            while (j < n && s[j] == s[i]) j++;
            out += s[i];
            // A length of 1 is left implicit; to_string writes 10 or more as several digits.
            if (j - i > 1) out += to_string(j - i);
            i = j;
        }
        return out;
    }
};
