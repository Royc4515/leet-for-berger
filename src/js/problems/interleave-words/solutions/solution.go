// O(n + m) time: alternate while both words have letters, then copy the longer word's tail.
func interleaveWords(word1 string, word2 string) string {
	common := len(word1)
	if len(word2) < common {
		common = len(word2)
	}
	// The final length is known, so the slice never has to grow.
	out := make([]byte, 0, len(word1)+len(word2))
	for i := 0; i < common; i++ {
		out = append(out, word1[i], word2[i])
	}
	// Only one of these tails is non-empty.
	out = append(out, word1[common:]...)
	out = append(out, word2[common:]...)
	return string(out)
}
