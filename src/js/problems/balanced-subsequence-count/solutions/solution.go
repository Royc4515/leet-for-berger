// O(n + 26 * maxFreq) = O(n) time: fix shared frequency k and multiply (1 + C(f, k)) per letter.
func countBalancedSubsequences(s string) int {
	const mod int64 = 1_000_000_007
	var counts [26]int
	maxFreq := 0
	for i := 0; i < len(s); i++ {
		idx := s[i] - 'a'
		counts[idx]++
		if counts[idx] > maxFreq {
			maxFreq = counts[idx]
		}
	}
	freqs := make([]int, 0, 26)
	for _, c := range counts {
		if c > 0 {
			freqs = append(freqs, c)
		}
	}

	fact := make([]int64, maxFreq+1)
	invFact := make([]int64, maxFreq+1)
	fact[0] = 1
	for i := 1; i <= maxFreq; i++ {
		fact[i] = fact[i-1] * int64(i) % mod
	}
	modPow := func(base, exp int64) int64 {
		res := int64(1)
		base %= mod
		for exp > 0 {
			if exp&1 == 1 {
				res = res * base % mod
			}
			base = base * base % mod
			exp >>= 1
		}
		return res
	}
	invFact[maxFreq] = modPow(fact[maxFreq], mod-2)
	for i := maxFreq; i >= 1; i-- {
		invFact[i-1] = invFact[i] * int64(i) % mod
	}

	var total int64
	for k := 1; k <= maxFreq; k++ {
		ways := int64(1)
		invK := invFact[k]
		for _, f := range freqs {
			if f >= k {
				comb := fact[f] * invK % mod * invFact[f-k] % mod
				ways = ways * (1 + comb) % mod
			}
		}
		total = (total + ways - 1 + mod) % mod
	}
	return int(total)
}
