def corp_flight_bookings(bookings: list[list[int]], n: int) -> list[int]:
    # O(n + b) time - mark where each booking starts and stops, then one running sum.
    # One slot past the end, so a booking that ends on flight n needs no bounds check.
    diff = [0] * (n + 1)
    for first, last, seats in bookings:
        diff[first - 1] += seats
        # The booking stops counting on the flight after `last` (index `last` when 0-based).
        diff[last] -= seats
    answer = [0] * n
    running = 0
    for i in range(n):
        running += diff[i]
        answer[i] = running
    return answer
