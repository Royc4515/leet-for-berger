class Solution {
public:
    // O(n) time: walk from the right end so the words come out already in reverse order. Skipping
    // every space before a word drops leading, trailing and repeated spaces in one move.
    string flipWordOrder(string s) {
        string out;
        out.reserve(s.size());
        int i = (int)s.size() - 1;
        while (i >= 0) {
            while (i >= 0 && s[i] == ' ') i--;
            if (i < 0) break;
            int end = i;
            while (i >= 0 && s[i] != ' ') i--;
            if (!out.empty()) out += ' ';
            out.append(s, i + 1, end - i);
        }
        return out;
    }
};
