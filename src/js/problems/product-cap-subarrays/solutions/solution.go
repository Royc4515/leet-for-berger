// O(n) time - all values are >= 1, so a longer window never has a smaller product and the
// leftmost valid start only moves forward.
func countProductBelow(nums []int, k int) int64 {
	// With k <= 1 no product qualifies, and the shrink loop would run past the window.
	if k <= 1 {
		return 0
	}
	product := int64(1) // below k * 10^4 < 10^13 before shrinking: needs 64 bits
	left := 0
	var count int64 // up to n(n + 1) / 2, about 5 * 10^9: keep it 64-bit explicitly
	for right := 0; right < len(nums); right++ {
		product *= int64(nums[right])
		for product >= int64(k) {
			product /= int64(nums[left])
			left++
		}
		// Every window that ends at right and starts in [left, right] fits.
		count += int64(right - left + 1)
	}
	return count
}
