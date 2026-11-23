// O(n) time, O(1) space: tally all 26 lowercase letters, then return the first index with count 1.
func firstLoneChar(s string) int {
	var counts [26]int
	for i := 0; i < len(s); i++ {
		counts[s[i]-'a']++
	}
	for i := 0; i < len(s); i++ {
		if counts[s[i]-'a'] == 1 {
			return i
		}
	}
	return -1
}
