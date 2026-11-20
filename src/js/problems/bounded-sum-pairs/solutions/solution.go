import "sort"

// O(n log n) time: positions do not matter, so sort a copy and count pairs with a sum of at most x
// using two pointers. The window [lower, upper] is count(upper) - count(lower - 1).
func countBoundedPairs(nums []int, lower int, upper int) int64 {
	a := make([]int, len(nums))
	copy(a, nums)
	sort.Ints(a)
	atMost := func(limit int) int64 {
		var count int64 // up to n(n - 1) / 2, about 5 * 10^9: keep it 64-bit explicitly
		lo, hi := 0, len(a)-1
		for lo < hi {
			if a[lo]+a[hi] <= limit {
				// a[lo] pairs with every index in (lo, hi]: all of them are at most a[hi].
				count += int64(hi - lo)
				lo++
			} else {
				hi--
			}
		}
		return count
	}
	return atMost(upper) - atMost(lower-1)
}
