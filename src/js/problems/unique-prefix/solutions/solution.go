// O(n) time, O(1) extra space - compact the slice in place, then return the kept prefix.
func removeDuplicates(nums []int) []int {
	write := 0
	for _, v := range nums {
		// Sorted input: the last kept value is the only one a new value can repeat.
		if write == 0 || v != nums[write-1] {
			nums[write] = v
			write++
		}
	}
	return nums[:write]
}
