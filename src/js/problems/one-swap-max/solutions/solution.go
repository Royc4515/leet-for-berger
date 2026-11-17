// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0600-0699/0670.Maximum%20Swap/Solution.go
import "strconv"

// O(d) time - improve the leftmost digit that has a larger digit somewhere to its right.
func maximumSwap(num int) int {
	s := []byte(strconv.Itoa(num))
	n := len(s)
	// d[i] = index of the largest digit in s[i:], the rightmost one on ties.
	d := make([]int, n)
	for i := range d {
		d[i] = i
	}
	for i := n - 2; i >= 0; i-- {
		// '<=' keeps the later copy: swapping with the last 9 of 1993 gives 9913, not 9193.
		if s[i] <= s[d[i+1]] {
			d[i] = d[i+1]
		}
	}
	for i, j := range d {
		if s[i] < s[j] {
			s[i], s[j] = s[j], s[i]
			break
		}
	}
	ans, _ := strconv.Atoi(string(s))
	return ans
}
