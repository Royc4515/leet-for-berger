// O(n) time, O(1) extra space - write pointer for the next non-zero slot, read pointer scans.
func moveZeroes(nums []int) []int {
	write := 0
	for read, v := range nums {
		if v != 0 {
			// Swapping (not copying) leaves the zeros behind, so no second fill pass is needed.
			nums[write], nums[read] = nums[read], nums[write]
			write++
		}
	}
	return nums
}
