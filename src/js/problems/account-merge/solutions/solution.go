// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0700-0799/0721.Accounts%20Merge/Solution.go
import "sort"

// O(E log E) for E emails - union-find over account indexes: each email links its account
// to the first account seen with it, which merges transitively connected accounts.
func accountsMerge(accounts [][]string) [][]string {
	n := len(accounts)
	p := make([]int, n)
	size := make([]int, n)
	for i := range p {
		p[i] = i
		size[i] = 1
	}
	find := func(x int) int {
		for p[x] != x {
			p[x] = p[p[x]]
			x = p[x]
		}
		return x
	}
	owner := make(map[string]int)
	for i := 0; i < n; i++ {
		for _, email := range accounts[i][1:] {
			j, ok := owner[email]
			if !ok {
				owner[email] = i
				continue
			}
			pa, pb := find(i), find(j)
			if pa == pb {
				continue
			}
			// Union by size keeps the trees shallow.
			if size[pa] < size[pb] {
				pa, pb = pb, pa
			}
			p[pb] = pa
			size[pa] += size[pb]
		}
	}
	// Iterating the owner map visits each distinct email once, so no duplicates survive.
	groups := make(map[int][]string)
	for email, i := range owner {
		root := find(i)
		groups[root] = append(groups[root], email)
	}
	ans := [][]string{}
	for root, emails := range groups {
		// Go compares strings bytewise, which is the required character-code order.
		sort.Strings(emails)
		ans = append(ans, append([]string{accounts[root][0]}, emails...))
	}
	sort.Slice(ans, func(a, b int) bool {
		if ans[a][0] != ans[b][0] {
			return ans[a][0] < ans[b][0]
		}
		return ans[a][1] < ans[b][1]
	})
	return ans
}
