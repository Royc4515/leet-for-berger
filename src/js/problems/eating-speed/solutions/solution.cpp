// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0800-0899/0875.Koko%20Eating%20Bananas/Solution.cpp
class Solution {
public:
    // O(n log(max pile)) time - hours only fall as speed rises, so binary search the speed.
    int minEatingSpeed(vector<int>& piles, int h) {
        // Speed max(piles) finishes every pile in one hour, and h >= piles.size(), so it always works.
        int l = 1, r = *max_element(piles.begin(), piles.end());
        while (l < r) {
            // l + (r - l) / 2: l + r can exceed INT_MAX when both are near 10^9.
            int mid = l + (r - l) / 2;
            // Up to 10^4 * 10^9 hours at speed 1: a 32-bit sum would wrap and look "fast enough".
            long long s = 0;
            for (int x : piles) {
                s += (x + (long long)mid - 1) / mid;
            }
            if (s <= h) {
                r = mid;
            } else {
                l = mid + 1;
            }
        }
        return l;
    }
};
