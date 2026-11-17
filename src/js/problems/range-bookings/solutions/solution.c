// O(n + b) time - mark where each booking starts and stops, then one running sum.
int* corpFlightBookings(int** bookings, int bookingsSize, int* bookingsColSize, int n, int* returnSize) {
    // One slot past the end, so a booking that ends on flight n needs no bounds check.
    int* diff = calloc(n + 1, sizeof(int));
    for (int i = 0; i < bookingsSize; i++) {
        diff[bookings[i][0] - 1] += bookings[i][2];
        // The booking stops counting on the flight after `last` (index `last` when 0-based).
        diff[bookings[i][1]] -= bookings[i][2];
    }
    int* answer = malloc(sizeof(int) * n);
    int running = 0; // at most 10^5 * 10^4 = 10^9 seats per flight, fits in an int
    for (int i = 0; i < n; i++) {
        running += diff[i];
        answer[i] = running;
    }
    free(diff);
    *returnSize = n;
    return answer;
}
