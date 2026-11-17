import "sort"

// O(n + d log d) time - count once, then order the d distinct values by the rule.
func topKFrequent(nums []int, k int) []int {
	count := map[int]int{}
	for _, x := range nums {
		count[x]++
	}
	values := make([]int, 0, len(count))
	for v := range count {
		values = append(values, v)
	}
	sort.Slice(values, func(i, j int) bool {
		a, b := values[i], values[j]
		if count[a] != count[b] {
			return count[a] > count[b]
		}
		return a < b
	})
	return values[:k]
}
