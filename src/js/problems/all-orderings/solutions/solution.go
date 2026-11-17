// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0046.Permutations/Solution.go
import (
	"slices"
	"sort"
)

// O(n! * n) time - fill positions left to right with any unused value. Sorting first and trying
// values in ascending order emits the permutations in lexicographic order.
func permute(nums []int) (ans [][]int) {
	a := append([]int(nil), nums...)
	sort.Ints(a)
	n := len(a)
	t := make([]int, n)
	vis := make([]bool, n)
	var dfs func(int)
	dfs = func(i int) {
		if i == n {
			ans = append(ans, slices.Clone(t))
			return
		}
		for j, x := range a {
			if !vis[j] {
				vis[j] = true
				t[i] = x
				dfs(i + 1)
				// Release the value so sibling branches can place it later.
				vis[j] = false
			}
		}
	}
	dfs(0)
	return
}
