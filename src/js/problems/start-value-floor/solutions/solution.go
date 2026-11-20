// O(n) time, O(1) space: after k steps the total is start + prefix[k], so the tightest moment is
// the lowest prefix sum. The lowest starts at 0 ("no steps yet") so the answer is at least 1.
func minStartValue(nums []int) int {
	total, lowest := 0, 0
	for _, v := range nums {
		total += v
		if total < lowest {
			lowest = total
		}
	}
	return 1 - lowest
}
