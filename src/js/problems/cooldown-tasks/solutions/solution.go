// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0600-0699/0621.Task%20Scheduler/Solution.go
// O(len) time - only the counts matter. The most frequent kind (count x) needs x - 1 frames of
// n + 1 slots, then one final slot for each kind that ties for x.
func leastInterval(tasks string, n int) int {
	cnt := make([]int, 26)
	x := 0
	for i := 0; i < len(tasks); i++ {
		c := tasks[i] - 'A'
		cnt[c]++
		x = max(x, cnt[c])
	}
	s := 0
	for _, v := range cnt {
		if v == x {
			s++
		}
	}
	// When the other kinds overflow the frames no slot is idle, so the length is the answer.
	return max(len(tasks), (x-1)*(n+1)+s)
}
