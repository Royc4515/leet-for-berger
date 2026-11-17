def count_primes(n: int) -> int:
    # O(n log log n) time - Sieve of Eratosthenes. Trial division of every number is too slow at 5 * 10^6.
    if n < 3:
        return 0
    is_prime = bytearray([1]) * n
    is_prime[0] = is_prime[1] = 0
    p = 2
    # A composite below n has a factor at most sqrt(n), so larger primes cross out nothing new.
    while p * p < n:
        if is_prime[p]:
            # Multiples below p * p already have a smaller prime factor; slice assignment keeps
            # the inner loop in C instead of the interpreter.
            is_prime[p * p :: p] = bytes(len(range(p * p, n, p)))
        p += 1
    return sum(is_prime)
