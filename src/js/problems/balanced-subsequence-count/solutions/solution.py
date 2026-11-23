def count_balanced_subsequences(s: str) -> int:
    # O(n + 26 * max_freq) = O(n) time: fix shared frequency k and multiply (1 + C(f, k)) per letter.
    mod = 1_000_000_007
    counts = [0] * 26
    base = ord("a")
    for ch in s:
        counts[ord(ch) - base] += 1

    freqs = [c for c in counts if c > 0]
    max_freq = max(freqs)

    # Precompute factorials and modular inverse factorials so each C(f, k) is O(1).
    fact = [1] * (max_freq + 1)
    for i in range(1, max_freq + 1):
        fact[i] = fact[i - 1] * i % mod
    inv_fact = [1] * (max_freq + 1)
    inv_fact[max_freq] = pow(fact[max_freq], mod - 2, mod)
    for i in range(max_freq, 0, -1):
        inv_fact[i - 1] = inv_fact[i] * i % mod

    total = 0
    for k in range(1, max_freq + 1):
        ways = 1
        inv_k = inv_fact[k]
        for f in freqs:
            if f >= k:
                comb = fact[f] * inv_k % mod * inv_fact[f - k] % mod
                ways = ways * (1 + comb) % mod
        # Subtract 1 for the empty subsequence where every letter chose 0 copies.
        total = (total + ways - 1) % mod
    return total
