class Solution {
public:
    // O(n log n) time - only the order of start and end events matters, not which meeting owns them.
    int minMeetingRooms(vector<vector<int>>& intervals) {
        vector<int> starts, ends;
        starts.reserve(intervals.size());
        ends.reserve(intervals.size());
        for (const auto& r : intervals) {
            starts.push_back(r[0]);
            ends.push_back(r[1]);
        }
        sort(starts.begin(), starts.end());
        sort(ends.begin(), ends.end());
        int rooms = 0;
        size_t e = 0;
        for (int s : starts) {
            // ends[e] is the earliest time a busy room frees up. `<` because a meeting ending at s
            // has already left its room, so the new meeting can take it.
            if (s < ends[e]) rooms++;
            else e++;
        }
        return rooms;
    }
};
