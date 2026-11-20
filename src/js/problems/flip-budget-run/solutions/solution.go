// O(n) time, O(1) space: the answer is the longest window that holds at most k zeros. The left
// edge only moves forward, so each element enters and leaves the window once.
func longestRunWithFlips(nums []int, k int) int {
	left, zeros, best := 0, 0, 0
	for right := 0; right < len(nums); right++ {
		if nums[right] == 0 {
			zeros++
		}
		// One new zero may be paid for by dropping many ones first, so this is a loop.
		for zeros > k {
			if nums[left] == 0 {
				zeros--
			}
			left++
		}
		if right-left+1 > best {
			best = right - left + 1
		}
	}
	return best
}
