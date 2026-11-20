// O(n) time, O(1) space: every counted substring straddles one border between two runs, and that
// border contributes min(left run, right run).
func countMatchingBlocks(s string) int {
	prev, cur, total := 0, 1, 0
	for i := 1; i < len(s); i++ {
		if s[i] == s[i-1] {
			cur++
		} else {
			total += min(prev, cur)
			prev, cur = cur, 1
		}
	}
	// The last run has no character after it to trigger the update above.
	return total + min(prev, cur)
}
