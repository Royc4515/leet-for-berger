// O(n) time, O(1) extra space: cyclic placement of each value v in 1..n into index v - 1.
func smallestPositiveGap(nums []int) int {
	n := len(nums)
	for i := 0; i < n; i++ {
		for nums[i] >= 1 && nums[i] <= n && nums[nums[i]-1] != nums[i] {
			target := nums[i] - 1
			nums[i], nums[target] = nums[target], nums[i]
		}
	}
	for i := 0; i < n; i++ {
		if nums[i] != i+1 {
			return i + 1
		}
	}
	return n + 1
}
