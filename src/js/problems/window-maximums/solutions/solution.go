// O(n) time - a deque of indices whose values strictly decrease from front to back.
func maxSlidingWindow(nums []int, k int) []int {
	// Each index is pushed once, so a slice of n slots with head and tail is enough.
	dq := make([]int, len(nums))
	head, tail := 0, 0
	out := make([]int, 0, len(nums)-k+1)
	for i, v := range nums {
		// A value no larger than the newcomer can never be a maximum again: it leaves first.
		for tail > head && nums[dq[tail-1]] <= v {
			tail--
		}
		dq[tail] = i
		tail++
		// The front is the window maximum unless it has slid out on the left.
		if dq[head] <= i-k {
			head++
		}
		if i >= k-1 {
			out = append(out, nums[dq[head]])
		}
	}
	return out
}
