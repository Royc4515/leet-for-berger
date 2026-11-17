// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0017.Letter%20Combinations%20of%20a%20Phone%20Number/Solution.go
// O(4^n * n) time - extend every partial string by each letter of the next digit.
func letterCombinations(digits string) []string {
	ans := []string{}
	// Without this check the loop would return [""] for no digits.
	if len(digits) == 0 {
		return ans
	}
	ans = append(ans, "")
	d := []string{"abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"}
	for _, i := range digits {
		s := d[i-'2']
		t := make([]string, 0, len(ans)*len(s))
		// Prefixes outer, letters inner: the result stays in lexicographic order.
		for _, a := range ans {
			for _, b := range s {
				t = append(t, a+string(b))
			}
		}
		ans = t
	}
	return ans
}
