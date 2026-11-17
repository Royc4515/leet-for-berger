import "sort"

// O(n log n) time - after sorting by start, a range can only overlap the one being built.
func merge(intervals [][]int) [][]int {
	sort.Slice(intervals, func(i, j int) bool { return intervals[i][0] < intervals[j][0] })
	merged := [][]int{}
	for _, r := range intervals {
		// `<=` because ranges are closed: [1, 4] and [4, 5] share the point 4.
		if n := len(merged); n > 0 && r[0] <= merged[n-1][1] {
			// max, not r[1]: the current range may already reach past this one.
			if r[1] > merged[n-1][1] {
				merged[n-1][1] = r[1]
			}
		} else {
			merged = append(merged, []int{r[0], r[1]})
		}
	}
	return merged
}
