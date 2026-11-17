// O(number of 1 bits) - n & (n - 1) clears the lowest set bit, so the loop runs once per 1
// instead of once per bit position. n is int64, so 2^31..2^32-1 stay positive.
func hammingWeight(n int64) int {
	count := 0
	for n != 0 {
		n &= n - 1
		count++
	}
	return count
}
