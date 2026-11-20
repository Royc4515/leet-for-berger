import "sort"

// O(n * L) hash lookups for text length n and longest word L: reach[i] says the first i
// characters split cleanly.
func canSplit(text string, words []string) bool {
	dictionary := make(map[string]bool, len(words))
	seen := map[int]bool{}
	lengths := []int{}
	for _, w := range words {
		dictionary[w] = true
		// Only lengths that occur in the dictionary can end a piece, so at most 20 probes per position.
		if !seen[len(w)] {
			seen[len(w)] = true
			lengths = append(lengths, len(w))
		}
	}
	sort.Ints(lengths)
	n := len(text)
	reach := make([]bool, n+1)
	reach[0] = true
	for i := 1; i <= n; i++ {
		for _, length := range lengths {
			if length > i {
				break
			}
			if reach[i-length] && dictionary[text[i-length:i]] {
				reach[i] = true
				break
			}
		}
	}
	return reach[n]
}
