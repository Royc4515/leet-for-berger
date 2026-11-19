// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0011.Container%20With%20Most%20Water/Solution.go
// O(n) time, O(1) space: the shorter end caps every narrower tank that uses it, so it can be
// dropped after one measurement. Each step drops one wall.
func maxWater(heights []int) int {
	l, r := 0, len(heights)-1
	best := 0
	for l < r {
		best = max(best, min(heights[l], heights[r])*(r-l))
		if heights[l] < heights[r] {
			l++
		} else {
			r--
		}
	}
	return best
}
