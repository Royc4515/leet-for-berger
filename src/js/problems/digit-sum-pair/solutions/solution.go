// O(n) time - only the two largest numbers of a digit-sum group can form its best pair, so
// remembering the largest number seen per digit sum (at most 81 sums) is enough.
func maximumSum(nums []int) int {
	var largest [82]int
	best := -1
	for _, v := range nums {
		s := 0
		for x := v; x > 0; x /= 10 {
			s += x % 10
		}
		// 0 means "nothing seen yet": every number is at least 1.
		if largest[s] > 0 && largest[s]+v > best {
			best = largest[s] + v
		}
		if v > largest[s] {
			largest[s] = v
		}
	}
	return best
}
