// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0332.Reconstruct%20Itinerary/Solution.go
import "sort"

// O(E log E) - Hierholzer's algorithm. Destinations are stored in descending order so the
// smallest unused one is always at the end, where removing it is O(1).
func findItinerary(tickets [][]string) []string {
	sorted := append([][]string(nil), tickets...)
	sort.Slice(sorted, func(i, j int) bool { return sorted[i][1] > sorted[j][1] })
	g := make(map[string][]string)
	for _, ticket := range sorted {
		g[ticket[0]] = append(g[ticket[0]], ticket[1])
	}
	// An explicit stack instead of recursion keeps the depth (up to 3 * 10^4) off the call
	// stack.
	stack := []string{"JFK"}
	ans := []string{}
	for len(stack) > 0 {
		f := stack[len(stack)-1]
		if next := g[f]; len(next) > 0 {
			g[f] = next[:len(next)-1]
			stack = append(stack, next[len(next)-1])
		} else {
			// No tickets left here, so this airport comes after everything still on the
			// stack: the route is built back to front.
			ans = append(ans, f)
			stack = stack[:len(stack)-1]
		}
	}
	for i, j := 0, len(ans)-1; i < j; i, j = i+1, j-1 {
		ans[i], ans[j] = ans[j], ans[i]
	}
	return ans
}
