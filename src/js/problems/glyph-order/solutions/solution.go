// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0200-0299/0269.Alien%20Dictionary/Solution.go
// O(C + 26^2): neighbors give one "x before y" edge at their first difference, then Kahn's
// algorithm always takes the smallest free letter, which yields the alphabetically first order.
func glyphOrder(words []string) string {
	present := [26]bool{}
	for _, w := range words {
		for i := 0; i < len(w); i++ {
			present[w[i]-'a'] = true
		}
	}
	edge := [26][26]bool{}
	indeg := [26]int{}
	for i := 0; i+1 < len(words); i++ {
		a, b := words[i], words[i+1]
		m := min(len(a), len(b))
		j := 0
		for j < m && a[j] == b[j] {
			j++
		}
		if j == m {
			// A word directly above its own proper prefix fits no order at all.
			if len(a) > len(b) {
				return ""
			}
			continue
		}
		u, v := a[j]-'a', b[j]-'a'
		// Count a repeated fact once, or its indegree never drops to zero.
		if !edge[u][v] {
			edge[u][v] = true
			indeg[v]++
		}
	}
	total := 0
	for _, p := range present {
		if p {
			total++
		}
	}
	used := [26]bool{}
	out := make([]byte, 0, total)
	for len(out) < total {
		pick := -1
		for c := 0; c < 26 && pick == -1; c++ {
			if present[c] && !used[c] && indeg[c] == 0 {
				pick = c
			}
		}
		// Letters remain but none is free: they lie on a cycle.
		if pick == -1 {
			return ""
		}
		used[pick] = true
		out = append(out, byte('a'+pick))
		for v := 0; v < 26; v++ {
			if edge[pick][v] {
				indeg[v]--
			}
		}
	}
	return string(out)
}
