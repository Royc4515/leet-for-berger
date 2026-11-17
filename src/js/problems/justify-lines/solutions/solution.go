// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0068.Text%20Justification/Solution.go
import "strings"

// O(total output) - greedy packing, then spacing rules per line.
func justifyText(words []string, maxWidth int) []string {
	ans := []string{}
	for i, n := 0, len(words); i < n; {
		// cnt is the line's width with single gaps; take words while that still fits.
		t := []string{words[i]}
		cnt := len(words[i])
		i++
		for i < n && cnt+1+len(words[i]) <= maxWidth {
			cnt += 1 + len(words[i])
			t = append(t, words[i])
			i++
		}
		// The last line and one-word lines are left-aligned (a one-word line has no gap to widen).
		if i == n || len(t) == 1 {
			left := strings.Join(t, " ")
			ans = append(ans, left+strings.Repeat(" ", maxWidth-len(left)))
			continue
		}
		gaps := len(t) - 1
		spaceWidth := maxWidth - (cnt - gaps)
		// Leftmost gaps take the remainder, one extra space each.
		w := spaceWidth / gaps
		m := spaceWidth % gaps
		row := strings.Builder{}
		for j, s := range t[:gaps] {
			row.WriteString(s)
			row.WriteString(strings.Repeat(" ", w))
			if j < m {
				row.WriteString(" ")
			}
		}
		row.WriteString(t[gaps])
		ans = append(ans, row.String())
	}
	return ans
}
