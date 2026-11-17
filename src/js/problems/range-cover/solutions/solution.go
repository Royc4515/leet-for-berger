// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0600-0699/0632.Smallest%20Range%20Covering%20Elements%20from%20K%20Lists/Solution.go
import "sort"

// O(N log N) time - merge every value with its list index, then slide a window over the merged
// order: grow on the right, shrink from the left while all k lists are still covered.
func smallestRange(nums [][]int) []int {
	type item struct{ val, list int }
	t := []item{}
	for i, x := range nums {
		for _, v := range x {
			t = append(t, item{v, i})
		}
	}
	sort.Slice(t, func(i, j int) bool { return t[i].val < t[j].val })
	k := len(nums)
	have := make([]int, k)
	covered, j := 0, 0
	var ans []int
	for _, x := range t {
		b, v := x.val, x.list
		if have[v] == 0 {
			covered++
		}
		have[v]++
		for covered == k {
			a, w := t[j].val, t[j].list
			// Strictly narrower only: b never decreases, so an equally wide window found later
			// starts later, and ties must go to the smaller start.
			if ans == nil || b-a < ans[1]-ans[0] {
				ans = []int{a, b}
			}
			have[w]--
			if have[w] == 0 {
				covered--
			}
			j++
		}
	}
	return ans
}
