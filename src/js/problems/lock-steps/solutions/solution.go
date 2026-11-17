// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0700-0799/0752.Open%20the%20Lock/Solution.go
import "strconv"

// O(10^4 * 8) - BFS over the 10^4 codes, stored as integers. One array marks both dead ends
// and visited codes, so every check is O(1) however many dead ends there are.
func openLock(deadends []string, target string) int {
	goal, _ := strconv.Atoi(target)
	if goal == 0 {
		return 0
	}
	blocked := make([]bool, 10000)
	for _, d := range deadends {
		v, _ := strconv.Atoi(d)
		blocked[v] = true
	}
	if blocked[0] {
		return -1
	}
	blocked[0] = true
	q := []int{0}
	for ans := 1; len(q) > 0; ans++ {
		next := []int{}
		for _, p := range q {
			for place := 1; place < 10000; place *= 10 {
				digit := p / place % 10
				// Turning up from 9 wraps to 0 and down from 0 wraps to 9.
				for _, nd := range [2]int{(digit + 1) % 10, (digit + 9) % 10} {
					t := p + (nd-digit)*place
					if t == goal {
						return ans
					}
					if !blocked[t] {
						blocked[t] = true
						next = append(next, t)
					}
				}
			}
		}
		q = next
	}
	return -1
}
