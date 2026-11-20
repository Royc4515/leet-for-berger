// O(n + m) time for input length n and output length m: one shared buffer, and a closing bracket
// repeats only the slice written since its opening bracket.
func unfoldBrackets(s string) string {
	out := []byte{}
	type group struct{ start, times int }
	stack := []group{}
	k := 0
	for i := 0; i < len(s); i++ {
		ch := s[i]
		switch {
		case ch >= '0' && ch <= '9':
			// Counts can have several digits.
			k = k*10 + int(ch-'0')
		case ch == '[':
			stack = append(stack, group{len(out), k})
			k = 0
		case ch == ']':
			g := stack[len(stack)-1]
			stack = stack[:len(stack)-1]
			// The group is already in the buffer once, so add times - 1 more copies. The slice is
			// copied first because append may move the buffer.
			part := append([]byte(nil), out[g.start:]...)
			for t := 1; t < g.times; t++ {
				out = append(out, part...)
			}
		default:
			out = append(out, ch)
		}
	}
	return string(out)
}
