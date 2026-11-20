// O(n) time, O(1) space: `total` holds the finished terms, `last` the open term (signed).
func evaluate(s string) int {
	total, last, num := 0, 0, 0
	op := byte('+')
	n := len(s)
	for i := 0; i < n; i++ {
		c := s[i]
		isDigit := c >= '0' && c <= '9'
		if isDigit {
			num = num*10 + int(c-'0')
		}
		// An operator ends the number before it; the end of the text ends the last one, even when
		// it is followed by spaces.
		if (c != ' ' && !isDigit) || i == n-1 {
			switch op {
			case '+':
				total += last
				last = num
			case '-':
				total += last
				last = -num
			case '*':
				last *= num
			default:
				// Go integer division truncates toward zero, which a negative `last` needs.
				last /= num
			}
			op = c
			num = 0
		}
	}
	return total + last
}
