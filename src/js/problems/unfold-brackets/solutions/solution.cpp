class Solution {
public:
    // O(n + m) time for input length n and output length m: one shared buffer, and a closing
    // bracket repeats only the slice written since its opening bracket.
    string unfoldBrackets(string s) {
        string out;
        vector<pair<size_t, int>> stack;  // {where the group starts in out, repeat count}
        int k = 0;
        for (char ch : s) {
            if (ch >= '0' && ch <= '9') {
                // Counts can have several digits.
                k = k * 10 + (ch - '0');
            } else if (ch == '[') {
                stack.push_back({out.size(), k});
                k = 0;
            } else if (ch == ']') {
                auto [start, times] = stack.back();
                stack.pop_back();
                // The group is already in the buffer once, so add times - 1 more copies. The slice
                // is copied first because appending to out may reallocate it.
                string group = out.substr(start);
                for (int t = 1; t < times; t++) out += group;
            } else {
                out += ch;
            }
        }
        return out;
    }
};
