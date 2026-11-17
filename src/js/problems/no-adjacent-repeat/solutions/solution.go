// O(26 * n) time - greedy left to right. With m letters still to place, a letter occurring more
// than m / 2 times must go next; otherwise the smallest letter that differs from the previous
// one keeps the rest arrangeable.
func reorganizeString(s string) string {
	n := len(s)
	cnt := [26]int{}
	mx := 0
	for i := 0; i < n; i++ {
		c := s[i] - 'a'
		cnt[c]++
		mx = max(mx, cnt[c])
	}
	// Beyond ceil(n / 2) copies, two of them must touch.
	if mx > (n+1)/2 {
		return ""
	}
	out := make([]byte, 0, n)
	prev := -1
	for m := n; m > 0; m-- {
		pick := -1
		// At most one letter can exceed half of what is left, so the first hit is the only one.
		for c := 0; c < 26 && pick < 0; c++ {
			if 2*cnt[c] > m {
				pick = c
			}
		}
		for c := 0; c < 26 && pick < 0; c++ {
			if cnt[c] > 0 && c != prev {
				pick = c
			}
		}
		cnt[pick]--
		out = append(out, byte('a'+pick))
		prev = pick
	}
	return string(out)
}
