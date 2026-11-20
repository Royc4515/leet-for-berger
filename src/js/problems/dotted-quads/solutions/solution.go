import "strings"

// O(1) for bounded input: 3 choices for each of 4 parts. Shorter parts are tried first, and a dot
// sorts before any digit, so the answers come out in dictionary order.
func dottedQuads(s string) []string {
	out := []string{}
	parts := []string{}
	var dfs func(pos int)
	dfs = func(pos int) {
		left := 4 - len(parts)
		rest := len(s) - pos
		// Each remaining part takes 1 to 3 digits; anything else is a dead end.
		if rest < left || rest > left*3 {
			return
		}
		if left == 0 {
			out = append(out, strings.Join(parts, "."))
			return
		}
		for l := 1; l <= 3; l++ {
			if pos+l > len(s) {
				break
			}
			part := s[pos : pos+l]
			// A leading zero is allowed only for the single digit "0".
			if l > 1 && part[0] == '0' {
				break
			}
			// Three-digit strings compare like numbers as text, so this is the "above 255" check.
			if len(part) == 3 && part > "255" {
				break
			}
			parts = append(parts, part)
			dfs(pos + l)
			parts = parts[:len(parts)-1]
		}
	}
	dfs(0)
	return out
}
