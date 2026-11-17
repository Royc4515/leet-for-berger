// O(n) time - each run is walked once, from its first number only.
func longestStreak(nums []int) int {
	values := make(map[int]bool, len(nums))
	for _, x := range nums {
		values[x] = true
	}
	best := 0
	for x := range values {
		if values[x-1] {
			continue // not a run start: counted from its first number
		}
		length := 1
		for values[x+length] {
			length++
		}
		if length > best {
			best = length
		}
	}
	return best
}
