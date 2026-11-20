import (
	"sort"
	"strings"
)

// O(n log n + L log n): sort once, then for each typed prefix the matching names form one block
// that starts at the first name that is not smaller than the prefix.
func suggestNames(products []string, searchWord string) [][]string {
	sorted := append([]string(nil), products...)
	sort.Strings(sorted)
	out := make([][]string, 0, len(searchWord))
	start := 0
	for i := 1; i <= len(searchWord); i++ {
		prefix := searchWord[:i]
		// A longer prefix keeps only a subset of the shorter one's matches, so the search can
		// begin where the previous one ended.
		start += sort.Search(len(sorted)-start, func(k int) bool { return sorted[start+k] >= prefix })
		row := []string{}
		for j := start; j < len(sorted) && len(row) < 3 && strings.HasPrefix(sorted[j], prefix); j++ {
			row = append(row, sorted[j])
		}
		out = append(out, row)
	}
	return out
}
