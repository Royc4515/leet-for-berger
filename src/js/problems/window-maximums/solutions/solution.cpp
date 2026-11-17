class Solution {
public:
    // O(n) time - a deque of indices whose values strictly decrease from front to back.
    vector<int> maxSlidingWindow(vector<int>& nums, int k) {
        deque<int> dq;
        vector<int> out;
        out.reserve(nums.size() - k + 1);
        for (int i = 0; i < (int)nums.size(); i++) {
            // A value no larger than the newcomer can never be a maximum again: it leaves first.
            while (!dq.empty() && nums[dq.back()] <= nums[i]) dq.pop_back();
            dq.push_back(i);
            // The front is the window maximum unless it has slid out on the left.
            if (dq.front() <= i - k) dq.pop_front();
            if (i >= k - 1) out.push_back(nums[dq.front()]);
        }
        return out;
    }
};
