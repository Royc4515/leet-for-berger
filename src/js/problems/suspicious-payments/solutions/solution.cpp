// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/1100-1199/1169.Invalid%20Transactions/Solution.cpp
class Solution {
public:
    // O(n + sum of g^2) time for name groups of size g, O(n) space.
    vector<string> suspiciousPayments(vector<string>& payments) {
        unordered_map<string, vector<tuple<int, string, int>>> byName;
        vector<bool> flagged(payments.size(), false);
        for (int i = 0; i < (int)payments.size(); i++) {
            vector<string> e = split(payments[i], ',');
            int minute = stoi(e[1]);
            const string& city = e[3];
            if (stoi(e[2]) > 1000) flagged[i] = true;
            auto& group = byName[e[0]];
            for (auto& [m, c, j] : group) {
                if (c != city && abs(minute - m) <= 60) {
                    // A conflict makes both records suspicious, including the one seen earlier.
                    flagged[i] = true;
                    flagged[j] = true;
                }
            }
            group.emplace_back(minute, city, i);
        }
        // Flags live on positions, so identical copies stay separate and input order is kept.
        vector<string> out;
        for (size_t i = 0; i < payments.size(); i++) if (flagged[i]) out.push_back(payments[i]);
        return out;
    }

private:
    static vector<string> split(const string& s, char delim) {
        stringstream ss(s);
        string item;
        vector<string> res;
        while (getline(ss, item, delim)) res.push_back(item);
        return res;
    }
};
