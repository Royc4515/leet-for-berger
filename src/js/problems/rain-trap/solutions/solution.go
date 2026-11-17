// O(n) time, O(1) space - two pointers that always move the side with the lower wall.
func trapRain(heights []int) int64 {
	lo, hi := 0, len(heights)-1
	leftMax, rightMax := 0, 0
	var water int64 // up to about 2 * 10^10: int64 keeps it exact even where int is 32 bits
	for lo < hi {
		// The lower end is bounded by its own side's maximum: the other side is at least as tall.
		if heights[lo] <= heights[hi] {
			if heights[lo] > leftMax {
				leftMax = heights[lo]
			}
			water += int64(leftMax - heights[lo])
			lo++
		} else {
			if heights[hi] > rightMax {
				rightMax = heights[hi]
			}
			water += int64(rightMax - heights[hi])
			hi--
		}
	}
	return water
}
