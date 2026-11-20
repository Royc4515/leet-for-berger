// O(n + q log n) time: prefix sums once, then one binary search per draw.
func weightedDrawLookup(weights []int, draws []int) []int {
	prefix := make([]int, len(weights))
	total := 0
	for i, w := range weights {
		total += w
		prefix[i] = total
	}
	result := make([]int, len(draws))
	for j, d := range draws {
		lo, hi := 0, len(prefix)-1
		// Index i owns [prefix[i - 1], prefix[i]), so the answer is the first prefix strictly above d.
		for lo < hi {
			mid := lo + (hi-lo)/2
			if prefix[mid] > d {
				hi = mid
			} else {
				lo = mid + 1
			}
		}
		result[j] = lo
	}
	return result
}
