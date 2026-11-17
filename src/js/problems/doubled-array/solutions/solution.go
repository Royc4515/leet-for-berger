// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/1900-1999/1929.Concatenation%20of%20Array/Solution.go
// O(n) - a fresh slice of capacity 2n. Appending to nums itself could write into spare capacity
// shared with the caller's slice.
func doubleArray(nums []int) []int {
	ans := make([]int, 0, 2*len(nums))
	ans = append(ans, nums...)
	return append(ans, nums...)
}
