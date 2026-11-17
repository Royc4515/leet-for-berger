// O(n + b) time - mark where each booking starts and stops, then one running sum.
func corpFlightBookings(bookings [][]int, n int) []int {
	// One slot past the end, so a booking that ends on flight n needs no bounds check.
	diff := make([]int, n+1)
	for _, b := range bookings {
		diff[b[0]-1] += b[2]
		// The booking stops counting on the flight after b[1] (index b[1] when 0-based).
		diff[b[1]] -= b[2]
	}
	answer := make([]int, n)
	running := 0
	for i := 0; i < n; i++ {
		running += diff[i]
		answer[i] = running
	}
	return answer
}
