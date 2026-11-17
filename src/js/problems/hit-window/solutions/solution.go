// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0362.Design%20Hit%20Counter/Solution.go
import "sort"

// O(1) amortized per hit, O(log n) per query: timestamps never decrease, so the slice of hits
// is already sorted and the window start is one binary search away.
type HitCounter struct {
	ts []int
}

func Constructor() HitCounter {
	return HitCounter{}
}

func (this *HitCounter) Hit(timestamp int) {
	this.ts = append(this.ts, timestamp)
}

func (this *HitCounter) GetHits(timestamp int) int {
	// The window is (timestamp - 300, timestamp]: its oldest second is timestamp - 299.
	return len(this.ts) - sort.SearchInts(this.ts, timestamp-300+1)
}
