// O(n) time, O(1) space - x ^ x == 0 and XOR is order independent, so every pair cancels and
// only the lone value survives the fold.
func singleNumber(nums []int) int {
	x := 0
	for _, v := range nums {
		x ^= v
	}
	return x
}
