class Solution {
public:
    // O(1) for bounded input: 3 choices for each of 4 parts. Shorter parts are tried first, and a
    // dot sorts before any digit, so the answers come out in dictionary order.
    vector<string> dottedQuads(string s) {
        vector<string> out;
        vector<string> parts;
        dfs(s, 0, parts, out);
        return out;
    }

private:
    void dfs(const string& s, int pos, vector<string>& parts, vector<string>& out) {
        int left = 4 - (int)parts.size();
        int rest = (int)s.size() - pos;
        // Each remaining part takes 1 to 3 digits; anything else is a dead end.
        if (rest < left || rest > left * 3) return;
        if (left == 0) {
            out.push_back(parts[0] + "." + parts[1] + "." + parts[2] + "." + parts[3]);
            return;
        }
        for (int len = 1; len <= 3; len++) {
            if (pos + len > (int)s.size()) break;
            string part = s.substr(pos, len);
            // A leading zero is allowed only for the single digit "0".
            if (len > 1 && part[0] == '0') break;
            if (stoi(part) > 255) break;
            parts.push_back(part);
            dfs(s, pos + len, parts, out);
            parts.pop_back();
        }
    }
};
