// O(n) time, O(1) space - xor every index 0..n with every value; present numbers cancel in pairs.
func missingNumber(nums []int) int {
	// Start from n: the loop below only visits the indices 0..n-1.
	result := len(nums)
	for i, v := range nums {
		result ^= i ^ v
	}
	return result
}
