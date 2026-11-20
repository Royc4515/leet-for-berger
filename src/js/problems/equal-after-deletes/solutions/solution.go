// O(n) time, O(n) space - a window that never shrinks; best is the highest count of one value seen.
func longestEqualSubarray(nums []int, k int) int {
	count := make([]int, len(nums)+1)
	best, left := 0, 0
	for right, v := range nums {
		count[v]++
		if count[v] > best {
			best = count[v]
		}
		// Too many deletions needed: slide instead of grow. A stale best only stops the window from
		// growing, and growing again needs a real new best.
		if right-left+1-best > k {
			count[nums[left]]--
			left++
		}
	}
	return best
}
