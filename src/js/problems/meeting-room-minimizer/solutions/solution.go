import "sort"

// O(n log n) time - only the order of start and end events matters, not which meeting owns them.
func minMeetingRooms(intervals [][]int) int {
	n := len(intervals)
	starts := make([]int, n)
	ends := make([]int, n)
	for i, r := range intervals {
		starts[i] = r[0]
		ends[i] = r[1]
	}
	sort.Ints(starts)
	sort.Ints(ends)
	rooms, e := 0, 0
	for _, s := range starts {
		// ends[e] is the earliest time a busy room frees up. `<` because a meeting ending at s
		// has already left its room, so the new meeting can take it.
		if s < ends[e] {
			rooms++
		} else {
			e++
		}
	}
	return rooms
}
