// O(n) time, O(1) space: one scan, and the magnitude stops growing once it passes 2^31.
func textToInt(s string) int {
	n := len(s)
	i := 0
	for i < n && s[i] == ' ' {
		i++
	}
	sign := 1
	if i < n && (s[i] == '+' || s[i] == '-') {
		if s[i] == '-' {
			sign = -1
		}
		i++
	}
	// Go's int is 64 bits here, so the check can come after the multiply.
	magnitude := 0
	for i < n && s[i] >= '0' && s[i] <= '9' {
		magnitude = magnitude*10 + int(s[i]-'0')
		// Digits only make it larger, so the answer is already a bound: stop reading.
		if magnitude > 2147483648 {
			break
		}
		i++
	}
	value := sign * magnitude
	if value > 2147483647 {
		return 2147483647
	}
	if value < -2147483648 {
		return -2147483648
	}
	return value
}
