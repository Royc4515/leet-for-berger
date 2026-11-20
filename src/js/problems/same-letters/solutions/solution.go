// O(n) time, O(1) space. Rearrangements have identical letter counts, so add for s and subtract
// for t in one table and require all 26 counters to end at zero.
func sameLetters(s string, t string) bool {
	if len(s) != len(t) {
		return false
	}
	var count [26]int
	for i := 0; i < len(s); i++ {
		count[s[i]-'a']++
		count[t[i]-'a']--
	}
	for _, c := range count {
		if c != 0 {
			return false
		}
	}
	return true
}
