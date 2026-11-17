// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0078.Subsets/Solution.go
import "sort"

// O(2^n * n) time - depth-first search over sorted values. Recording each partial subset on
// entry, before it is extended, puts every prefix ahead of its extensions: lexicographic order.
func subsets(nums []int) (ans [][]int) {
	a := append([]int(nil), nums...)
	sort.Ints(a)
	t := []int{}
	var dfs func(int)
	dfs = func(start int) {
		// Copy: t's backing array is reused by later appends.
		ans = append(ans, append([]int{}, t...))
		for i := start; i < len(a); i++ {
			t = append(t, a[i])
			dfs(i + 1)
			t = t[:len(t)-1]
		}
	}
	dfs(0)
	return
}
