import "sort"

// O(n * k log k) time - the sorted letters are the same key for every anagram.
func groupAnagrams(words []string) [][]string {
	// Go maps have no order, so the map holds group indexes; the slice keeps order.
	index := map[string]int{}
	groups := [][]string{}
	for _, w := range words {
		letters := []byte(w)
		sort.Slice(letters, func(i, j int) bool { return letters[i] < letters[j] })
		key := string(letters)
		if g, ok := index[key]; ok {
			groups[g] = append(groups[g], w)
		} else {
			index[key] = len(groups)
			groups = append(groups, []string{w})
		}
	}
	return groups
}
