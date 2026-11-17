/**
 * O(n + b) time - mark where each booking starts and stops, then one running sum.
 * @param {number[][]} bookings
 * @param {number} n
 * @return {number[]}
 */
function corpFlightBookings(bookings, n) {
  // One slot past the end, so a booking that ends on flight n needs no bounds check.
  const diff = new Array(n + 1).fill(0);
  for (const [first, last, seats] of bookings) {
    diff[first - 1] += seats;
    // The booking stops counting on the flight after `last` (index `last` when 0-based).
    diff[last] -= seats;
  }
  const answer = new Array(n);
  let running = 0;
  for (let i = 0; i < n; i++) {
    running += diff[i];
    answer[i] = running;
  }
  return answer;
}
