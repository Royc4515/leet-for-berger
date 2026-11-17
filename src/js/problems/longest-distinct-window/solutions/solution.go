// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0003.Longest%20Substring%20Without%20Repeating%20Characters/Solution.go
// O(n) time - each character enters the window once and leaves it at most once.
func lengthOfLongestSubstring(s string) (ans int) {
	// Input is ASCII, so indexing bytes is safe and a fixed table replaces a map.
	cnt := [128]int{}
	l := 0
	for r := 0; r < len(s); r++ {
		c := s[r]
		cnt[c]++
		// Shrink from the left until the new character is no longer duplicated.
		for cnt[c] > 1 {
			cnt[s[l]]--
			l++
		}
		ans = max(ans, r-l+1)
	}
	return
}
