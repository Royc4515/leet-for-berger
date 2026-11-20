// O(n + max(nums)) - taking a value takes all its copies, so each value is worth v * count[v],
// and it conflicts only with v - 1 and v + 1: house robber on the value line.
func maxPoints(nums []int) int {
	mx := 0
	for _, v := range nums {
		mx = max(mx, v)
	}
	total := make([]int, mx+1)
	for _, v := range nums {
		total[v] += v
	}
	skip := 0 // best score using values up to v - 2
	best := 0 // best score using values up to v - 1
	for v := 1; v <= mx; v++ {
		// Absent values have total 0, so a gap in the values lets both neighbours be taken.
		take := skip + total[v]
		skip = best
		best = max(best, take)
	}
	return best
}
