import "sort"

// O(n log n) time - tails[k] is the smallest last value of any increasing run of length k + 1.
func lengthOfLis(nums []int) int {
	tails := []int{}
	for _, x := range nums {
		// SearchInts finds the first tail >= x, so an equal value never extends a run.
		i := sort.SearchInts(tails, x)
		if i == len(tails) {
			tails = append(tails, x)
		} else {
			// A smaller ending for the same length can only help later elements.
			tails[i] = x
		}
	}
	return len(tails)
}
