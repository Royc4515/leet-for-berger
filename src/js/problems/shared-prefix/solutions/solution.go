// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0014.Longest%20Common%20Prefix/Solution.go
// O(total length) - vertical scan: column i of every word, stopping at the first mismatch.
func longestCommonPrefix(strs []string) string {
	n := len(strs)
	for i := range strs[0] {
		for j := 1; j < n; j++ {
			// Check the length first: a shorter word has run out, so the prefix ends here.
			if len(strs[j]) <= i || strs[j][i] != strs[0][i] {
				return strs[0][:i]
			}
		}
	}
	return strs[0]
}
