class Solution {
    // O(n + b) time - mark where each booking starts and stops, then one running sum.
    public int[] corpFlightBookings(int[][] bookings, int n) {
        // One slot past the end, so a booking that ends on flight n needs no bounds check.
        int[] diff = new int[n + 1];
        for (int[] b : bookings) {
            diff[b[0] - 1] += b[2];
            // The booking stops counting on the flight after b[1] (index b[1] when 0-based).
            diff[b[1]] -= b[2];
        }
        int[] answer = new int[n];
        int running = 0; // at most 10^5 * 10^4 = 10^9 seats per flight, fits in an int
        for (int i = 0; i < n; i++) {
            running += diff[i];
            answer[i] = running;
        }
        return answer;
    }
}
