SIDE = 1001
AREA = SIDE * SIDE


class SquareCounter:
    # O(1) per add; per count, O(distinct points in the query's column). A corner on the query's
    # vertical line fixes the side length d, and the square lies either to the left or to the
    # right, so each such corner is checked twice.

    def __init__(self):
        # Multiplicity of every grid point, flattened: point (x, y) lives at x * SIDE + y.
        self.cnt = [0] * AREA
        # Distinct y values seen in each column, so count walks only the column it needs.
        self.cols = [[] for _ in range(SIDE)]

    def add(self, point: list[int]) -> None:
        x, y = point
        k = x * SIDE + y
        if self.cnt[k] == 0:
            self.cols[x].append(y)
        self.cnt[k] += 1

    def count(self, point: list[int]) -> int:
        x, y = point
        cnt = self.cnt
        base = x * SIDE
        total = 0
        for y2 in self.cols[x]:
            d = y2 - y
            if d == 0:
                continue
            # Copies are distinct choices, so the multiplicities multiply.
            here = cnt[base + y2]
            # d can be negative, so both bounds are checked on both sides.
            left = base - d * SIDE
            if 0 <= left < AREA:
                total += here * cnt[left + y] * cnt[left + y2]
            right = base + d * SIDE
            if 0 <= right < AREA:
                total += here * cnt[right + y] * cnt[right + y2]
        return total
