// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0700-0799/0721.Accounts%20Merge/Solution.cpp
class Solution {
public:
    // O(E log E) for E emails - union-find over account indexes: each email links its account
    // to the first account seen with it, which merges transitively connected accounts.
    vector<vector<string>> accountsMerge(vector<vector<string>>& accounts) {
        int n = accounts.size();
        vector<int> p(n), size(n, 1);
        iota(p.begin(), p.end(), 0);
        auto find = [&](int x) {
            while (p[x] != x) {
                p[x] = p[p[x]];
                x = p[x];
            }
            return x;
        };
        unordered_map<string, int> owner;
        for (int i = 0; i < n; ++i) {
            for (int j = 1; j < (int)accounts[i].size(); ++j) {
                auto [it, inserted] = owner.emplace(accounts[i][j], i);
                if (inserted) continue;
                int pa = find(i), pb = find(it->second);
                if (pa == pb) continue;
                // Union by size keeps the trees shallow.
                if (size[pa] < size[pb]) swap(pa, pb);
                p[pb] = pa;
                size[pa] += size[pb];
            }
        }
        // Iterating the owner map visits each distinct email once, so no duplicates survive.
        unordered_map<int, vector<string>> groups;
        for (auto& [email, i] : owner) groups[find(i)].push_back(email);
        vector<vector<string>> ans;
        for (auto& [root, emails] : groups) {
            // std::string compares bytes, which is the required character-code order.
            sort(emails.begin(), emails.end());
            vector<string> account{accounts[root][0]};
            account.insert(account.end(), emails.begin(), emails.end());
            ans.push_back(move(account));
        }
        sort(ans.begin(), ans.end(), [](const vector<string>& a, const vector<string>& b) {
            return a[0] != b[0] ? a[0] < b[0] : a[1] < b[1];
        });
        return ans;
    }
};
