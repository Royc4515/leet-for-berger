// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0218.The%20Skyline%20Problem/Solution.cpp
class Solution {
public:
    // O(n log n) - sweep the edges left to right with a max-heap of the buildings already
    // started, as (height, right). Finished buildings are removed lazily, only when they reach
    // the top: the top is all that matters, and searching the heap for them would be O(n).
    vector<vector<int>> getSkyline(vector<vector<int>>& buildings) {
        vector<int> lines;
        for (auto& v : buildings) {
            lines.push_back(v[0]);
            lines.push_back(v[1]);
        }
        sort(lines.begin(), lines.end());
        lines.erase(unique(lines.begin(), lines.end()), lines.end());
        priority_queue<pair<int, int>> pq;
        vector<vector<int>> skys;
        int city = 0, n = buildings.size();
        for (int line : lines) {
            while (city < n && buildings[city][0] <= line) {
                pq.emplace(buildings[city][2], buildings[city][1]);
                ++city;
            }
            while (!pq.empty() && pq.top().second <= line) {
                pq.pop();
            }
            int high = pq.empty() ? 0 : pq.top().first;
            // Only a change of height is a key point.
            if (!skys.empty() && skys.back()[1] == high) {
                continue;
            }
            skys.push_back({line, high});
        }
        return skys;
    }
};
