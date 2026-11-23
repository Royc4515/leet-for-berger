class Solution {
public:
    // O(n log n + D) time - each day, attend the available event that ends soonest.
    int maxEvents(vector<vector<int>>& events) {
        vector<vector<int>> sorted(events);
        sort(sorted.begin(), sorted.end());
        priority_queue<int, vector<int>, greater<int>> ends;
        int attended = 0, day = 0;
        size_t i = 0;
        while (i < sorted.size() || !ends.empty()) {
            // Nothing available: jump to the next start day instead of walking empty days.
            if (ends.empty()) day = max(day, sorted[i][0]);
            while (i < sorted.size() && sorted[i][0] == day) ends.push(sorted[i++][1]);
            // Events that ended before today can no longer be attended.
            while (!ends.empty() && ends.top() < day) ends.pop();
            if (!ends.empty()) {
                ends.pop();
                attended++;
            }
            day++;
        }
        return attended;
    }
};
