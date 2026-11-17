// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0600-0699/0670.Maximum%20Swap/Solution.cpp
class Solution {
public:
    // O(d) time - improve the leftmost digit that has a larger digit somewhere to its right.
    int maximumSwap(int num) {
        string s = to_string(num);
        int n = s.size();
        // d[i] = index of the largest digit in s[i..], the rightmost one on ties.
        vector<int> d(n);
        iota(d.begin(), d.end(), 0);
        for (int i = n - 2; i >= 0; --i) {
            // '<=' keeps the later copy: swapping with the last 9 of 1993 gives 9913, not 9193.
            if (s[i] <= s[d[i + 1]]) {
                d[i] = d[i + 1];
            }
        }
        for (int i = 0; i < n; ++i) {
            int j = d[i];
            if (s[i] < s[j]) {
                swap(s[i], s[j]);
                break;
            }
        }
        return stoi(s);
    }
};
