import "sort"

// O(n log n) - sort by end time; best[i] is the top profit using the first i jobs, either
// skipping job i or taking it on top of the best schedule that ends by its start.
func maxJobProfit(startTime []int, endTime []int, profit []int) int {
	n := len(startTime)
	// Sort job indexes, not three slices: the three slices must stay aligned.
	order := make([]int, n)
	for i := range order {
		order[i] = i
	}
	sort.Slice(order, func(a, b int) bool { return endTime[order[a]] < endTime[order[b]] })
	ends := make([]int, n)
	for i, job := range order {
		ends[i] = endTime[job]
	}
	best := make([]int, n+1)
	for i, job := range order {
		// SearchInts finds the first end >= start + 1, i.e. it counts the jobs with end <= start
		// (a job may begin exactly when another ends). They all sort before job i.
		compatible := sort.SearchInts(ends, startTime[job]+1)
		best[i+1] = max(best[i], best[compatible]+profit[job])
	}
	return best[n]
}
