public class Solution {
    // O(n log log n) time - Sieve of Eratosthenes. Trial division of every number is too slow at 5 * 10^6.
    public int CountPrimes(int n) {
        if (n < 3) return 0;
        bool[] composite = new bool[n];
        // A composite below n has a factor at most sqrt(n), so larger primes cross out nothing new.
        // The bound is checked as p <= (n - 1) / p: p * p would overflow int past sqrt(int.MaxValue).
        for (int p = 2; p <= (n - 1) / p; p++) {
            if (composite[p]) continue;
            // Multiples below p * p already have a smaller prime factor.
            for (int q = p * p; q < n; q += p) composite[q] = true;
        }
        int count = 0;
        for (int k = 2; k < n; k++) if (!composite[k]) count++;
        return count;
    }
}
