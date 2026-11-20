import "sort"

// O(n log n) - ranges that overlap through a chain must share a group, so they form blocks
// (the merged intervals) and each block independently picks group 1 or 2: 2^blocks ways.
func countSplits(ranges [][]int) int {
	const mod = 1_000_000_007
	// Sort a copy of the row slices: the caller's slice is not ours to reorder.
	sorted := make([][]int, len(ranges))
	copy(sorted, ranges)
	sort.Slice(sorted, func(i, j int) bool { return sorted[i][0] < sorted[j][0] })
	blocks := 0
	reach := -1 // furthest end seen so far
	for _, r := range sorted {
		// `>` and not `>=`: ranges are closed, so a range starting at `reach` still shares it.
		if r[0] > reach {
			blocks++
		}
		// max, not r[1]: a nested range must not shorten the reach of the one around it.
		reach = max(reach, r[1])
	}
	// The modulus is applied while doubling: the power is far beyond any fixed-width integer.
	ways := 1
	for i := 0; i < blocks; i++ {
		ways = ways * 2 % mod
	}
	return ways
}
