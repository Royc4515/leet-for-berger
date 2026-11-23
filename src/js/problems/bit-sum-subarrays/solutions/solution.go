// O(n) time, O(1) extra space: exact sum == goal equals atMost(goal) - atMost(goal - 1).
func countBitSubarrays(nums []int, goal int) int64 {
	atMost := func(limit int) int64 {
		if limit < 0 {
			return 0
		}
		left, window := 0, 0
		var total int64
		for right, v := range nums {
			window += v
			for window > limit {
				window -= nums[left]
				left++
			}
			total += int64(right - left + 1)
		}
		return total
	}
	return atMost(goal) - atMost(goal-1)
}
