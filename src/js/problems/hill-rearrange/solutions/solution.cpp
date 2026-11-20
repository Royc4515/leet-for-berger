class Solution {
public:
    // O(n^2) worst case (a deeply nested hill re-slices and sorts at every level).
    // Cut into top-level hills, rearrange inside each, then place the pieces largest first.
    string rearrangeHills(string s) {
        return solve(s, 0, (int)s.size());
    }

private:
    // Rearranges the hill s[lo, hi), which may be empty.
    string solve(const string& s, int lo, int hi) {
        vector<string> pieces;
        int height = 0;
        int start = lo;
        for (int i = lo; i < hi; i++) {
            height += s[i] == '1' ? 1 : -1;
            if (height == 0) {
                // A piece is "1" + hill + "0": strip the outer pair before recursing, or the
                // recursion would never get smaller.
                pieces.push_back("1" + solve(s, start + 1, i) + "0");
                start = i + 1;
            }
        }
        // No piece is a prefix of another, so plain descending text order is the best concatenation.
        sort(pieces.begin(), pieces.end(), greater<string>());
        string out;
        for (const string& p : pieces) out += p;
        return out;
    }
};
