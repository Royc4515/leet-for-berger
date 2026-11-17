// O(n) time, O(n) space - KMP prefix function.
func smallestBaseSegment(s string) string {
	n := len(s)
	pi := make([]int, n)
	for i := 1; i < n; i++ {
		k := pi[i-1]
		// Fall back through shorter borders until the next char can extend one.
		for k > 0 && s[i] != s[k] {
			k = pi[k-1]
		}
		if s[i] == s[k] {
			k++
		}
		pi[i] = k
	}
	period := n - pi[n-1]
	// A period only builds s from whole copies when it divides n ("ababa" -> itself).
	if n%period == 0 {
		return s[:period]
	}
	return s
}
