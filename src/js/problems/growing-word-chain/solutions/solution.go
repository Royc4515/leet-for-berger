import "sort"

// O(n * L^2) time, O(n * L) space. Short words first, so every predecessor (one letter
// shorter) already holds its final chain length when a word looks it up.
func longestChain(words []string) int {
	sorted := append([]string(nil), words...)
	sort.SliceStable(sorted, func(i, j int) bool { return len(sorted[i]) < len(sorted[j]) })
	best := make(map[string]int, len(sorted))
	answer := 0
	for _, w := range sorted {
		// Deleting one letter lists every word that can grow into w: at most L lookups, no pair scan.
		here := 1
		for i := 0; i < len(w); i++ {
			if prev, ok := best[w[:i]+w[i+1:]]; ok && prev+1 > here {
				here = prev + 1
			}
		}
		best[w] = here
		if here > answer {
			answer = here
		}
	}
	return answer
}
