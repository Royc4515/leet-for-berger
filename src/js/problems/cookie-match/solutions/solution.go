// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0400-0499/0455.Assign%20Cookies/Solution.go
import "sort"

// O(n log n + m log m) time - a cookie too small for the least greedy child is useless to all.
func findContentChildren(g []int, s []int) int {
	sort.Ints(g)
	sort.Ints(s)
	j := 0
	for i, x := range g {
		// Skip cookies that cannot satisfy this child; they cannot satisfy anyone greedier either.
		for j < len(s) && s[j] < x {
			j++
		}
		if j >= len(s) {
			return i
		}
		j++
	}
	return len(g)
}
