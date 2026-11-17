// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0076.Minimum%20Window%20Substring/Solution.go
// O(m + n) time - grow right until t is covered, then shrink left while it stays covered.
func minWindow(s string, t string) string {
	need := make([]int, 128)
	window := make([]int, 128)
	for i := 0; i < len(t); i++ {
		need[t[i]]++
	}
	m, n := len(s), len(t)
	// cnt counts window characters that fill a still-needed slot of t; cnt == n means covered.
	k, mi, cnt := -1, m+1, 0
	for l, r := 0, 0; r < m; r++ {
		c := s[r]
		if window[c]++; window[c] <= need[c] {
			cnt++
		}
		for cnt == n {
			// Strictly shorter only: the first window of the minimum length is the leftmost.
			if r-l+1 < mi {
				mi = r - l + 1
				k = l
			}
			c = s[l]
			if window[c] <= need[c] {
				cnt--
			}
			window[c]--
			l++
		}
	}
	if k < 0 {
		return ""
	}
	return s[k : k+mi]
}
