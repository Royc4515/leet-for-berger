// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/2400-2499/2466.Count%20Ways%20To%20Build%20Good%20Strings/Solution.go
// O(high) time - different step sequences give different strings, so count sequences:
// f[i] = f[i - zero] + f[i - one], the last step being a block of 0s or a block of 1s.
func countGoodStrings(low int, high int, zero int, one int) int {
	const mod int = 1e9 + 7
	// Bottom-up rather than recursive, so the depth does not grow with high.
	f := make([]int, high+1)
	f[0] = 1
	ans := 0
	for i := 1; i <= high; i++ {
		if i >= zero {
			f[i] += f[i-zero]
		}
		if i >= one {
			f[i] += f[i-one]
		}
		f[i] %= mod
		if i >= low {
			ans = (ans + f[i]) % mod
		}
	}
	return ans
}
