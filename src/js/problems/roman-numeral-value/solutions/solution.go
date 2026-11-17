var romanValues = map[byte]int{'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000}

// O(n) time - each symbol only needs its right neighbour to know its sign.
func romanToInt(s string) int {
	total := 0
	for i := 0; i < len(s); i++ {
		v := romanValues[s[i]]
		// A smaller symbol before a larger one is the left half of a subtractive pair (IV, CM).
		if i+1 < len(s) && v < romanValues[s[i+1]] {
			total -= v
		} else {
			total += v
		}
	}
	return total
}
