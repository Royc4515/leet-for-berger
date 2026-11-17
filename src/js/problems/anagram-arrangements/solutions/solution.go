// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/2500-2599/2514.Count%20Anagrams/Solution.go
import "strings"

const mod int = 1e9 + 7

// O(n + log mod) - the answer is the product over words of len! / (c_a! * c_b! * ...). Both
// products are built letter by letter: the i-th letter of a word multiplies the numerator by i,
// and the k-th copy of a letter multiplies the denominator by k.
func countArrangements(s string) int {
	ans, mul := 1, 1
	for _, w := range strings.Split(s, " ") {
		cnt := [26]int{}
		for i, c := range w {
			cnt[c-'a']++
			ans = ans * (i + 1) % mod
			mul = mul * cnt[c-'a'] % mod
		}
	}
	// mod is prime, so dividing is multiplying by the inverse (Fermat: x^(mod-2)); one inverse
	// at the end suffices.
	return ans * powMod(mul, mod-2) % mod
}

// Binary exponentiation; Go's int is 64-bit here, enough for a product of two residues.
func powMod(x, n int) int {
	res := 1
	for ; n > 0; n >>= 1 {
		if n&1 > 0 {
			res = res * x % mod
		}
		x = x * x % mod
	}
	return res
}
