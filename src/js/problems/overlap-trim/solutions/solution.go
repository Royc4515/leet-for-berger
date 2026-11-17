// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0400-0499/0435.Non-overlapping%20Intervals/Solution.go
import (
	"math"
	"sort"
)

// O(n log n) time - keeping the interval that ends first leaves the most room for the rest.
func eraseOverlapIntervals(intervals [][]int) int {
	sort.Slice(intervals, func(i, j int) bool {
		return intervals[i][1] < intervals[j][1]
	})
	ans := len(intervals)
	// Below every allowed start, so the first interval is always kept.
	lastEnd := math.MinInt32
	for _, e := range intervals {
		// '>=' because touching at an endpoint is not an overlap.
		if e[0] >= lastEnd {
			ans--
			lastEnd = e[1]
		}
	}
	return ans
}
