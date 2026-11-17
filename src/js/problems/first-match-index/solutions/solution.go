// O(n + m) - Knuth-Morris-Pratt. fail[i] is the length of the longest proper prefix of
// needle[0..i] that is also its suffix: after a mismatch, that much is already matched.
func firstMatchIndex(haystack string, needle string) int {
	m := len(needle)
	fail := make([]int, m)
	for i, k := 1, 0; i < m; i++ {
		for k > 0 && needle[i] != needle[k] {
			k = fail[k-1]
		}
		if needle[i] == needle[k] {
			k++
		}
		fail[i] = k
	}
	// k counts needle characters matched so far; the text pointer never moves back.
	for i, k := 0, 0; i < len(haystack); i++ {
		for k > 0 && haystack[i] != needle[k] {
			k = fail[k-1]
		}
		if haystack[i] == needle[k] {
			k++
		}
		if k == m {
			return i - m + 1
		}
	}
	return -1
}
