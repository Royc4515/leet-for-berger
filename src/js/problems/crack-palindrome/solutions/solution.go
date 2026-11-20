// O(n) time. Lower the earliest letter that is not 'a'; if the whole first half is 'a', raise the
// last letter to 'b' instead.
func crackPalindrome(palindrome string) string {
	n := len(palindrome)
	if n < 2 {
		return ""
	}
	c := []byte(palindrome)
	// Only the first half: the middle of an odd palindrome mirrors itself, so lowering it keeps the
	// string a palindrome ("aba" -> "aaa").
	for i := 0; i < n/2; i++ {
		if c[i] != 'a' {
			c[i] = 'a'
			return string(c)
		}
	}
	c[n-1] = 'b'
	return string(c)
}
