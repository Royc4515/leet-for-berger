// O(m + n) time - two read heads; the smaller front value is always the next output.
func mergeSorted(nums1 []int, nums2 []int) []int {
	out := make([]int, 0, len(nums1)+len(nums2))
	i, j := 0, 0
	for i < len(nums1) && j < len(nums2) {
		// <= takes nums1 first on ties, which keeps the merge stable.
		if nums1[i] <= nums2[j] {
			out = append(out, nums1[i])
			i++
		} else {
			out = append(out, nums2[j])
			j++
		}
	}
	// At most one of these is non-empty, and what is left is already sorted.
	out = append(out, nums1[i:]...)
	return append(out, nums2[j:]...)
}
