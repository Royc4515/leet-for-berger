// O(log x) time: peel the last digit and append it to the result, once per digit.
func flipDigits(x int) int {
	// Go's int is 64 bits here, but the answer must fit 32, so the limits are checked by hand
	// (on both sides) after the loop.
	rest := x
	if rest < 0 {
		rest = -rest
	}
	flipped := 0
	for rest > 0 {
		flipped = flipped*10 + rest%10
		rest /= 10
	}
	if x < 0 {
		flipped = -flipped
	}
	if flipped < -(1<<31) || flipped > (1<<31)-1 {
		return 0
	}
	return flipped
}
