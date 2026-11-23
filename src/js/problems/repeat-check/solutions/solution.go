// O(n) average time, O(n) space: pre-size the map to reduce rehashing and exit on the first repeat.
func hasRepeat(nums []int) bool {
	seen := make(map[int]struct{}, len(nums))
	for _, v := range nums {
		if _, ok := seen[v]; ok {
			return true
		}
		seen[v] = struct{}{}
	}
	return false
}
