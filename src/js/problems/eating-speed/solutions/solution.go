// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0800-0899/0875.Koko%20Eating%20Bananas/Solution.go
import "sort"

// O(n log(max pile)) time - hours only fall as speed rises, so binary search the speed.
func minEatingSpeed(piles []int, h int) int {
	// Speed max(piles) finishes every pile in one hour, and h >= len(piles), so it always works.
	hi := 1
	for _, x := range piles {
		hi = max(hi, x)
	}
	// sort.Search finds the first index in [0, hi) where the predicate holds; index i is speed i + 1.
	// Go's int is 64-bit on the judged platforms, so the hour sum cannot wrap.
	return 1 + sort.Search(hi, func(i int) bool {
		k := i + 1
		s := 0
		for _, x := range piles {
			s += (x + k - 1) / k
		}
		return s <= h
	})
}
