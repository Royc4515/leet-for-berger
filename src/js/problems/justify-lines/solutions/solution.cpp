// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0068.Text%20Justification/Solution.cpp
class Solution {
public:
    // O(total output) - greedy packing, then spacing rules per line.
    vector<string> justifyText(vector<string>& words, int maxWidth) {
        vector<string> ans;
        for (int i = 0, n = words.size(); i < n;) {
            // cnt is the line's width with single gaps; take words while that still fits.
            vector<string> t = {words[i]};
            int cnt = words[i++].size();
            while (i < n && cnt + 1 + (int)words[i].size() <= maxWidth) {
                cnt += 1 + words[i].size();
                t.emplace_back(words[i++]);
            }
            // The last line and one-word lines are left-aligned (a one-word line has no gap to widen).
            if (i == n || t.size() == 1) {
                string left = t[0];
                for (size_t j = 1; j < t.size(); ++j) left += " " + t[j];
                ans.emplace_back(left + string(maxWidth - left.size(), ' '));
                continue;
            }
            int gaps = t.size() - 1;
            int spaceWidth = maxWidth - (cnt - gaps);
            // Leftmost gaps take the remainder, one extra space each.
            int w = spaceWidth / gaps, m = spaceWidth % gaps;
            string row;
            for (int j = 0; j < gaps; ++j) {
                row += t[j];
                row += string(w + (j < m ? 1 : 0), ' ');
            }
            row += t[gaps];
            ans.emplace_back(row);
        }
        return ans;
    }
};
