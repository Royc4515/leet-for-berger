// O(n) time, O(1) space: the counter is the number of brackets open right now.
func maxParenDepth(s string) int {
	depth, best := 0, 0
	for _, ch := range s {
		if ch == '(' {
			depth++
			// A new peak can only appear right after an opening bracket.
			if depth > best {
				best = depth
			}
		} else if ch == ')' {
			depth--
		}
	}
	return best
}
