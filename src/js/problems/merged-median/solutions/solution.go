// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0004.Median%20of%20Two%20Sorted%20Arrays/Solution.go
// O(log(m + n)) time - find the k-th smallest of the union by discarding k/2 values per step.
func medianTimesTwo(nums1 []int, nums2 []int) int64 {
	m, n := len(nums1), len(nums2)
	var f func(i, j, k int) int
	f = func(i, j, k int) int {
		if i >= m {
			return nums2[j+k-1]
		}
		if j >= n {
			return nums1[i+k-1]
		}
		if k == 1 {
			return min(nums1[i], nums2[j])
		}
		p := k / 2
		// A side with fewer than p values left cannot hold the k-th among its first p, so the other side drops p.
		// No sentinel value: inputs span the whole int range, so any sentinel could collide with real data.
		if i+p-1 >= m {
			return f(i, j+p, k-p)
		}
		if j+p-1 >= n {
			return f(i+p, j, k-p)
		}
		if nums1[i+p-1] < nums2[j+p-1] {
			return f(i+p, j, k-p)
		}
		return f(i, j+p, k-p)
	}
	// The two middle positions coincide when the total is odd, which gives twice the middle value.
	return int64(f(0, 0, (m+n+1)/2)) + int64(f(0, 0, (m+n+2)/2))
}
