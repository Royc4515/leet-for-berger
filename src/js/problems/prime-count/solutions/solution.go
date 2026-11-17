// O(n log log n) time - Sieve of Eratosthenes. Trial division of every number is too slow at 5 * 10^6.
func countPrimes(n int) int {
	if n < 3 {
		return 0
	}
	composite := make([]bool, n)
	// A composite below n has a factor at most sqrt(n), so larger primes cross out nothing new.
	for p := 2; p*p < n; p++ {
		if composite[p] {
			continue
		}
		// Multiples below p * p already have a smaller prime factor.
		for q := p * p; q < n; q += p {
			composite[q] = true
		}
	}
	count := 0
	for k := 2; k < n; k++ {
		if !composite[k] {
			count++
		}
	}
	return count
}
