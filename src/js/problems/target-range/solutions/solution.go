// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0034.Find%20First%20and%20Last%20Position%20of%20Element%20in%20Sorted%20Array/Solution.go
import "sort"

// O(log n) time - two lower bounds: the first index >= target and the first index >= target + 1.
func searchRange(nums []int, target int) []int {
	l := sort.SearchInts(nums, target)
	r := sort.SearchInts(nums, target+1)
	// An empty run [l, r) means the target is absent.
	if l == r {
		return []int{-1, -1}
	}
	return []int{l, r - 1}
}
