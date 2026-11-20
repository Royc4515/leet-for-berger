// O(n log(sum)) time: if a limit works, every larger limit works, so binary search the smallest
// limit whose greedy pass needs at most `days` days.
func minDailyLimit(weights []int, days int) int {
	fits := func(limit int) bool {
		used, load := 1, 0
		for _, w := range weights {
			// A load equal to the limit is allowed, so a new day starts only when it would be passed.
			if load+w > limit {
				used++
				load = 0
			}
			load += w
		}
		return used <= days
	}
	// Every package must fit on a day by itself, and one day carries everything at the total.
	lo, hi := 0, 0
	for _, w := range weights {
		if w > lo {
			lo = w
		}
		hi += w
	}
	for lo < hi {
		mid := lo + (hi-lo)/2
		if fits(mid) {
			hi = mid
		} else {
			lo = mid + 1
		}
	}
	return lo
}
