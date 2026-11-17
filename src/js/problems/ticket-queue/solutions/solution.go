// O(n) time - count what the simulation would do instead of running it.
func timeToBuy(tickets []int, k int) int64 {
	target := tickets[k]
	var total int64 // up to 10^14: a 32-bit int overflows
	for i, t := range tickets {
		// Everyone ahead of k gets target turns, everyone behind target - 1; nobody buys extra.
		limit := target - 1
		if i <= k {
			limit = target
		}
		if t < limit {
			limit = t
		}
		total += int64(limit)
	}
	return total
}
