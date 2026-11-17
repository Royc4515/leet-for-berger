// O(n) time, O(n) space - one pass, value -> index.
func pairSum(nums []int, target int) []int {
	seen := make(map[int]int, len(nums))
	for j, x := range nums {
		// Look before storing x, so a position is never paired with itself.
		if i, ok := seen[target-x]; ok {
			return []int{i, j}
		}
		seen[x] = j
	}
	return []int{}
}
