// O(log10 x) time - reverse only the lower half of the digits, so the reversed part never
// outgrows the original the way a full reversal of 1234567899 outgrows 32 bits.
func isPalindrome(x int) bool {
	// A trailing zero would need a leading zero to match; only 0 itself qualifies.
	if x < 0 || (x%10 == 0 && x != 0) {
		return false
	}
	half := 0
	for x > half {
		half = half*10 + x%10
		x /= 10
	}
	// Odd digit count: the middle digit ended up in half, so drop it before comparing.
	return x == half || x == half/10
}
