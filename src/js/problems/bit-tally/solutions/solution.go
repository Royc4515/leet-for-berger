// O(n) time - i >> 1 drops the lowest bit of i, and its count is already in the table.
func countBits(n int) []int {
	// n + 1 entries: the count for n itself is part of the answer.
	tally := make([]int, n+1)
	for i := 1; i <= n; i++ {
		tally[i] = tally[i>>1] + i&1
	}
	return tally
}
