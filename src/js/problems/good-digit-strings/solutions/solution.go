// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/1900-1999/1922.Count%20Good%20Numbers/Solution.go
const mod int64 = 1e9 + 7

// O(log n) - positions are independent: (n + 1) / 2 even indices with 5 choices and n / 2 odd
// indices with 4.
func countGoodStrings(n int64) int {
	return int(powMod(5, (n+1)>>1) * powMod(4, n>>1) % mod)
}

// Binary exponentiation; int64 throughout because two residues multiply to about 10^18.
func powMod(x, e int64) int64 {
	var res int64 = 1
	for e != 0 {
		if e&1 == 1 {
			res = res * x % mod
		}
		x = x * x % mod
		e >>= 1
	}
	return res
}
