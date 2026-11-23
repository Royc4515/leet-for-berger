import "sort"

// O(n log n) time - in sorted order the closest value to any element is one of its neighbours.
func minimumAbsDifference(arr []int) [][]int {
	values := append([]int(nil), arr...)
	sort.Ints(values)
	best := values[1] - values[0]
	for i := 2; i < len(values); i++ {
		if d := values[i] - values[i-1]; d < best {
			best = d
		}
	}
	// Scanning left to right yields the pairs already in ascending order.
	pairs := [][]int{}
	for i := 1; i < len(values); i++ {
		if values[i]-values[i-1] == best {
			pairs = append(pairs, []int{values[i-1], values[i]})
		}
	}
	return pairs
}
