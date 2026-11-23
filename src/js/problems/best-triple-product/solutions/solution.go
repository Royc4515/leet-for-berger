// O(n) time, O(1) space: track the three largest and two smallest numbers in one pass.
func maxTripleProduct(nums []int) int {
	max1, max2, max3 := -1001, -1001, -1001
	min1, min2 := 1001, 1001
	for _, v := range nums {
		if v >= max1 {
			max3, max2, max1 = max2, max1, v
		} else if v >= max2 {
			max3, max2 = max2, v
		} else if v > max3 {
			max3 = v
		}
		if v <= min1 {
			min2, min1 = min1, v
		} else if v < min2 {
			min2 = v
		}
	}
	a := max1 * max2 * max3
	b := min1 * min2 * max1
	if a > b {
		return a
	}
	return b
}
