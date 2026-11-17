// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/1400-1499/1456.Maximum%20Number%20of%20Vowels%20in%20a%20Substring%20of%20Given%20Length/Solution.go
// O(n) time - sliding the window adds one character and drops one, so the count updates in O(1).
func maxVowels(s string, k int) int {
	isVowel := func(c byte) bool {
		return c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u'
	}
	cnt := 0
	for i := 0; i < k; i++ {
		if isVowel(s[i]) {
			cnt++
		}
	}
	ans := cnt
	for i := k; i < len(s); i++ {
		if isVowel(s[i-k]) {
			cnt--
		}
		if isVowel(s[i]) {
			cnt++
		}
		ans = max(ans, cnt)
	}
	return ans
}
