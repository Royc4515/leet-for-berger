# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0053.Maximum%20Subarray/Solution.py
def max_sub_array(nums: list[int]) -> int:
    # O(n) time - the best run ending at i either extends the one ending at i - 1 or starts at i.
    # Start from nums[0], not 0: the run must be non-empty, so all-negative input stays negative.
    ans = run = nums[0]
    for x in nums[1:]:
        # A negative running sum only drags the next element down, so drop it.
        run = max(run, 0) + x
        ans = max(ans, run)
    return ans
