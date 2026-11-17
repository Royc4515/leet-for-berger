// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0127.Word%20Ladder/Solution.go
// O(N * L * 26) word generations - BFS level by level; neighbours come from trying every
// letter at every position and checking the set, never from comparing all pairs of words.
func ladderLength(beginWord string, endWord string, wordList []string) int {
	words := make(map[string]bool)
	for _, word := range wordList {
		words[word] = true
	}
	if !words[endWord] {
		return 0
	}
	// Clearing a word when it is queued doubles as the visited mark.
	words[beginWord] = false
	q := []string{beginWord}
	ans := 1
	for len(q) > 0 {
		ans++
		next := []string{}
		for _, s := range q {
			chars := []byte(s)
			for j := 0; j < len(chars); j++ {
				ch := chars[j]
				for k := byte('a'); k <= 'z'; k++ {
					chars[j] = k
					t := string(chars)
					if !words[t] {
						continue
					}
					if t == endWord {
						return ans
					}
					next = append(next, t)
					words[t] = false
				}
				chars[j] = ch
			}
		}
		q = next
	}
	return 0
}
