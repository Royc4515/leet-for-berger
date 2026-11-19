// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0392.Is%20Subsequence/Solution.go
// O(|s| + |t|) time, O(1) space. Matching each letter of s at its earliest spot in t
// leaves the most room for the rest, so the greedy scan never needs to backtrack.
func isSubsequence(s string, t string) bool {
	i := 0
	for j := 0; i < len(s) && j < len(t); j++ {
		if s[i] == t[j] {
			i++
		}
	}
	return i == len(s)
}
