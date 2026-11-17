// O(n) - Manacher's algorithm. d1[i] is the radius of the longest odd palindrome centered at i,
// d2[i] that of the longest even one whose right middle is i. Inside the rightmost palindrome
// found so far [l, r], the mirror position gives a radius for free.
func widestPalindrome(s string) string {
	n := len(s)
	bestLen, bestStart := 0, 0
	// Ties go to the leftmost start, whichever order the candidates arrive in.
	consider := func(length, start int) {
		if length > bestLen || (length == bestLen && start < bestStart) {
			bestLen, bestStart = length, start
		}
	}

	d1 := make([]int, n)
	for i, l, r := 0, 0, -1; i < n; i++ {
		k := 1
		if i <= r {
			k = min(d1[l+r-i], r-i+1)
		}
		for i-k >= 0 && i+k < n && s[i-k] == s[i+k] {
			k++
		}
		d1[i] = k
		if i+k-1 > r {
			l, r = i-k+1, i+k-1
		}
		consider(2*k-1, i-k+1)
	}

	d2 := make([]int, n)
	for i, l, r := 0, 0, -1; i < n; i++ {
		k := 0
		if i <= r {
			k = min(d2[l+r-i+1], r-i+1)
		}
		for i-k-1 >= 0 && i+k < n && s[i-k-1] == s[i+k] {
			k++
		}
		d2[i] = k
		if i+k-1 > r {
			l, r = i-k, i+k-1
		}
		if k > 0 {
			consider(2*k, i-k)
		}
	}

	return s[bestStart : bestStart+bestLen]
}
