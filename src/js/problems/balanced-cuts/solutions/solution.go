// O(n log(sum)) time: binary search the smallest cap for which a greedy pass needs at most k parts.
func minLargestPart(nums []int, k int) int64 {
	fits := func(cap int64) bool {
		parts := 1
		var current int64
		for _, v := range nums {
			// Closing a part as late as possible never hurts the parts after it.
			if current+int64(v) > cap {
				parts++
				current = int64(v)
			} else {
				current += int64(v)
			}
		}
		return parts <= k
	}
	// The total reaches 10^10, so the bounds and the midpoint are int64.
	var low, high int64
	for _, v := range nums {
		if int64(v) > low {
			low = int64(v)
		}
		high += int64(v)
	}
	for low < high {
		mid := (low + high) / 2
		if fits(mid) {
			high = mid
		} else {
			low = mid + 1
		}
	}
	return low
}
