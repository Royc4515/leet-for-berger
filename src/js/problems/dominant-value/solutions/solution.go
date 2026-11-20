// O(n) time, O(1) space - a candidate and a tally; every different value cancels one copy of it.
func majorityElement(nums []int) int {
	candidate, tally := 0, 0
	for _, v := range nums {
		// The prefix so far cancelled out evenly, so the majority is still the majority of the rest.
		if tally == 0 {
			candidate = v
		}
		if v == candidate {
			tally++
		} else {
			tally--
		}
	}
	return candidate
}
