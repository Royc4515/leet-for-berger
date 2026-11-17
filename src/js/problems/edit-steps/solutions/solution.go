// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0072.Edit%20Distance/Solution.go
// O(m * n) time, O(n) space: one DP row over prefixes of word2 per letter of word1.
func minDistance(word1 string, word2 string) int {
	m, n := len(word1), len(word2)
	prev := make([]int, n+1)
	cur := make([]int, n+1)
	for j := range prev {
		prev[j] = j
	}
	for i := 1; i <= m; i++ {
		cur[0] = i
		for j := 1; j <= n; j++ {
			if word1[i-1] == word2[j-1] {
				cur[j] = prev[j-1]
			} else {
				// Replace, delete from word1, insert into word1.
				cur[j] = min(prev[j-1], prev[j], cur[j-1]) + 1
			}
		}
		prev, cur = cur, prev
	}
	return prev[n]
}
