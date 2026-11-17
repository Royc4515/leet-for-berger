/**
 * O(n log log n) time - Sieve of Eratosthenes. Trial division of every number is too slow at 5 * 10^6.
 * @param {number} n
 * @return {number}
 */
function countPrimes(n) {
  if (n < 3) return 0;
  // A typed array is one byte per flag; a plain array of booleans is several times larger.
  const composite = new Uint8Array(n);
  // A composite below n has a factor at most sqrt(n), so larger primes cross out nothing new.
  for (let p = 2; p * p < n; p++) {
    if (composite[p]) continue;
    // Multiples below p * p already have a smaller prime factor.
    for (let q = p * p; q < n; q += p) composite[q] = 1;
  }
  let count = 0;
  for (let k = 2; k < n; k++) if (!composite[k]) count++;
  return count;
}
