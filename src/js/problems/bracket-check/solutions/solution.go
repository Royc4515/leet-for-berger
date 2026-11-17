// O(n) time - the most recently opened bracket must close first, so keep openers on a stack.
func isValid(s string) bool {
	pairs := map[byte]byte{')': '(', ']': '[', '}': '{'}
	stack := make([]byte, 0, len(s))
	for i := 0; i < len(s); i++ {
		ch := s[i]
		want, closer := pairs[ch]
		if !closer {
			stack = append(stack, ch)
			continue
		}
		// An empty stack means a closer with nothing open.
		if len(stack) == 0 || stack[len(stack)-1] != want {
			return false
		}
		stack = stack[:len(stack)-1]
	}
	// Leftover openers were never closed.
	return len(stack) == 0
}
