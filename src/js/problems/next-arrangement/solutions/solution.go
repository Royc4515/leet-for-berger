// O(n) time, O(1) extra space: pivot = rightmost position that can still grow, swap it with the
// rightmost larger value, then reverse the suffix so it is as small as possible.
func nextArrangement(nums []int) []int {
	n := len(nums)
	i := n - 2
	// The suffix after the pivot is non-increasing; strict ">=" keeps equal values from counting as growable.
	for i >= 0 && nums[i] >= nums[i+1] {
		i--
	}
	if i >= 0 {
		j := n - 1
		for nums[j] <= nums[i] {
			j--
		}
		nums[i], nums[j] = nums[j], nums[i]
	}
	// With no pivot (i = -1) this reverses the whole array: the last arrangement wraps to the first.
	for l, r := i+1, n-1; l < r; l, r = l+1, r-1 {
		nums[l], nums[r] = nums[r], nums[l]
	}
	return nums
}
