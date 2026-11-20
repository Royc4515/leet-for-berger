import "strconv"

// O(n) time. i marks the start of a run, j walks to its end; the next run starts at j, so the last
// run needs no separate flush.
func squeezeRuns(s string) string {
	// The result is never longer than the input, so one allocation covers it.
	out := make([]byte, 0, len(s))
	i := 0
	for i < len(s) {
		j := i
		for j < len(s) && s[j] == s[i] {
			j++
		}
		out = append(out, s[i])
		// A length of 1 is left implicit; Itoa writes 10 or more as several digits.
		if j-i > 1 {
			out = strconv.AppendInt(out, int64(j-i), 10)
		}
		i = j
	}
	return string(out)
}
