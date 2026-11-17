class Solution {
public:
    // O(M + R + K log K) time, O(M + K) space - index groups once.
    vector<int> notifyRecipients(vector<vector<int>>& users, vector<string>& requests) {
        unordered_set<int> known;
        unordered_map<int, vector<int>> members;
        for (auto& row : users) {
            known.insert(row[0]);
            for (size_t j = 1; j < row.size(); j++) members[row[j]].push_back(row[0]);
        }
        unordered_set<int> out, expanded;
        for (auto& r : requests) {
            size_t colon = r.find(':');
            int id = stoi(r.substr(colon + 1));
            if (r.compare(0, colon, "user") == 0) {
                if (known.count(id)) out.insert(id);
            } else if (expanded.insert(id).second) {
                // Walk each group at most once: repeated group requests add nothing new.
                auto it = members.find(id);
                if (it != members.end()) out.insert(it->second.begin(), it->second.end());
            }
        }
        vector<int> result(out.begin(), out.end());
        sort(result.begin(), result.end());
        return result;
    }
};
