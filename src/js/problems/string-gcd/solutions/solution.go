// O(m + n) time - concatenation test, then the gcd-length prefix.
func gcdOfStrings(str1 string, str2 string) string {
	// If both strings repeat the same x, gluing them in either order gives the same string;
	// if they do not, some position disagrees.
	if str1+str2 != str2+str1 {
		return ""
	}
	// Any common divisor's length divides both lengths, and the gcd-length prefix is one of them.
	a, b := len(str1), len(str2)
	for b != 0 {
		a, b = b, a%b
	}
	return str1[:a]
}
