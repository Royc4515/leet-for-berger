import "sort"

// O(n log n) time. Sorted, the cheapest win for the smallest unbeaten value is the next larger
// one, so one forward pointer finds every match.
func rankBoost(nums []int) int {
	sort.Ints(nums)
	j := 0
	// j never passes the current index, so nums[j] is always a value already seen or equal to x.
	for _, x := range nums {
		if x > nums[j] {
			j++
		}
	}
	return j
}
