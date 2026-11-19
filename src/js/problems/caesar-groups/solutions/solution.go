// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0249.Group%20Shifted%20Strings/Solution.go
// O(n * k) time: every word is normalized once, then grouped by that key.
func groupByShift(words []string) [][]string {
	// Go maps have no order, so the map holds group indexes; the slice keeps order.
	index := map[string]int{}
	groups := [][]string{}
	for _, w := range words {
		t := []byte(w)
		diff := t[0] - 'a'
		for i := range t {
			// Shift back so the word starts with 'a'; a letter that falls below 'a' wraps.
			t[i] -= diff
			if t[i] < 'a' {
				t[i] += 26
			}
		}
		key := string(t)
		if g, ok := index[key]; ok {
			groups[g] = append(groups[g], w)
		} else {
			index[key] = len(groups)
			groups = append(groups, []string{w})
		}
	}
	return groups
}
