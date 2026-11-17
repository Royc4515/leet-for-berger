// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0152.Maximum%20Product%20Subarray/Solution.go
// O(n) time - a negative factor swaps the largest and smallest products, so keep both.
func maxProduct(nums []int) int64 {
	// int64 explicitly: products reach 10^15. f: largest, g: smallest product of a run ending here.
	f, g, ans := int64(nums[0]), int64(nums[0]), int64(nums[0])
	for _, v := range nums[1:] {
		// Use the old f and g for both updates; x alone covers starting a new run (after a 0).
		x, ff, gg := int64(v), f, g
		f = max(x, ff*x, gg*x)
		g = min(x, ff*x, gg*x)
		ans = max(ans, f)
	}
	return ans
}
