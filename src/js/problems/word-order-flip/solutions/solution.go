// O(n) time: walk from the right end so the words come out already in reverse order. Skipping
// every space before a word drops leading, trailing and repeated spaces in one move.
func flipWordOrder(s string) string {
	// The answer is never longer than the input, so one allocation covers it.
	out := make([]byte, 0, len(s))
	i := len(s) - 1
	for i >= 0 {
		for i >= 0 && s[i] == ' ' {
			i--
		}
		if i < 0 {
			break
		}
		end := i
		for i >= 0 && s[i] != ' ' {
			i--
		}
		if len(out) > 0 {
			out = append(out, ' ')
		}
		out = append(out, s[i+1:end+1]...)
	}
	return string(out)
}
