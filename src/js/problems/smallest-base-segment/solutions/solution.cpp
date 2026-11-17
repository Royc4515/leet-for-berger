class Solution {
public:
    // O(n) time, O(n) space - KMP prefix function.
    string smallestBaseSegment(string s) {
        int n = s.size();
        vector<int> pi(n, 0);
        for (int i = 1; i < n; i++) {
            int k = pi[i - 1];
            // Fall back through shorter borders until the next char can extend one.
            while (k > 0 && s[i] != s[k]) k = pi[k - 1];
            if (s[i] == s[k]) k++;
            pi[i] = k;
        }
        int period = n - pi[n - 1];
        // A period only builds s from whole copies when it divides n ("ababa" -> itself).
        return n % period == 0 ? s.substr(0, period) : s;
    }
};
