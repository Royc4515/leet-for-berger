// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0900-0999/0981.Time%20Based%20Key-Value%20Store/Solution.cpp
// O(1) per set, O(log n) per get: set timestamps only increase, so appending keeps each key's
// versions sorted by time and a get is one binary search.
class TimeMap {
public:
    TimeMap() {
    }

    void set(string key, string value, int timestamp) {
        ktv[key].emplace_back(timestamp, value);
    }

    string get(string key, int timestamp) {
        // find, not operator[]: a query must not create an entry for a key that was never set.
        auto it = ktv.find(key);
        if (it == ktv.end()) {
            return "";
        }
        auto& pairs = it->second;
        // The first version stamped after `timestamp`; the answer is the one just before it.
        auto i = upper_bound(pairs.begin(), pairs.end(), timestamp,
            [](int t, const pair<int, string>& p) { return t < p.first; });
        return i == pairs.begin() ? "" : prev(i)->second;
    }

private:
    unordered_map<string, vector<pair<int, string>>> ktv;
};
