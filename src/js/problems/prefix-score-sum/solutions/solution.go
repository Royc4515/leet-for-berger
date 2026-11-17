// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/2200-2299/2223.Sum%20of%20Scores%20of%20Built%20Strings/Solution.go
// O(n) - the Z-function. z[i] is the score of the suffix at i; [l, r] is the rightmost segment
// known to equal a prefix, and inside it z values are copied instead of recomputed.
func prefixScoreSum(s string) int64 {
	n := len(s)
	z := make([]int, n)
	for i, l, r := 1, 0, 0; i < n; i++ {
		if i <= r {
			// s[i..r] equals s[i-l..r-l], so z[i - l] applies, capped at the known segment.
			z[i] = min(r-i+1, z[i-l])
		}
		for i+z[i] < n && s[z[i]] == s[i+z[i]] {
			z[i]++
		}
		if i+z[i]-1 > r {
			l, r = i, i+z[i]-1
		}
	}
	// int64: for n = 10^5 the total is about 5 * 10^9.
	ans := int64(n)
	for _, x := range z {
		ans += int64(x)
	}
	return ans
}
