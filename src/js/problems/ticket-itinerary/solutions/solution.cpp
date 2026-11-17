// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0332.Reconstruct%20Itinerary/Solution.cpp
class Solution {
public:
    // O(E log E) - Hierholzer's algorithm. Destinations are stored in descending order so the
    // smallest unused one is always at the back, where pop_back() is O(1).
    vector<string> findItinerary(vector<vector<string>>& tickets) {
        vector<vector<string>> sorted = tickets;
        sort(sorted.rbegin(), sorted.rend());
        unordered_map<string, vector<string>> g;
        for (const auto& ticket : sorted) {
            g[ticket[0]].push_back(ticket[1]);
        }
        // An explicit stack instead of recursion keeps the depth (up to 3 * 10^4) off the call
        // stack.
        vector<string> stack{"JFK"};
        vector<string> ans;
        while (!stack.empty()) {
            auto& next = g[stack.back()];
            if (!next.empty()) {
                string t = next.back();
                next.pop_back();
                stack.push_back(t);
            } else {
                // No tickets left here, so this airport comes after everything still on the
                // stack: the route is built back to front.
                ans.push_back(stack.back());
                stack.pop_back();
            }
        }
        reverse(ans.begin(), ans.end());
        return ans;
    }
};
