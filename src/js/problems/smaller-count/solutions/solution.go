// O(n + 101) time - values are 0..100, so count them instead of comparing pairs.
func smallerNumbersThanCurrent(nums []int) []int {
	var freq [101]int
	for _, v := range nums {
		freq[v]++
	}
	// smaller[v] = how many elements are below v: a running total of the counts before v.
	var smaller [101]int
	for v := 1; v <= 100; v++ {
		smaller[v] = smaller[v-1] + freq[v-1]
	}
	answer := make([]int, len(nums))
	for i, v := range nums {
		answer[i] = smaller[v]
	}
	return answer
}
