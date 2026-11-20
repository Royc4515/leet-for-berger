import (
	"sort"
	"strings"
)

// O(n^2) worst case (a deeply nested hill re-slices and sorts at every level).
// Cut into top-level hills, rearrange inside each, then place the pieces largest first.
func rearrangeHills(s string) string {
	pieces := []string{}
	height := 0
	start := 0
	for i := 0; i < len(s); i++ {
		if s[i] == '1' {
			height++
		} else {
			height--
		}
		if height == 0 {
			// A piece is "1" + hill + "0": strip the outer pair before recursing, or the
			// recursion would never get smaller.
			pieces = append(pieces, "1"+rearrangeHills(s[start+1:i])+"0")
			start = i + 1
		}
	}
	// No piece is a prefix of another, so plain descending text order is the best concatenation.
	sort.Sort(sort.Reverse(sort.StringSlice(pieces)))
	return strings.Join(pieces, "")
}
