// O(log n) time - binary exponentiation.
func powerMod(x int, n int64) int {
	const mod = 1000000007
	// int64 throughout: two residues below mod multiply to about 10^18, which needs 64 bits.
	base := int64(x) % mod
	result := int64(1)
	for n > 0 {
		// Each set bit of n contributes the matching square x^(2^k).
		if n&1 == 1 {
			result = result * base % mod
		}
		base = base * base % mod
		n >>= 1
	}
	return int(result)
}
