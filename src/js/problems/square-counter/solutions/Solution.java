import java.util.*;

// O(1) per add; per count, O(distinct points in the query's column). A corner on the query's
// vertical line fixes the side length d, and the square lies either to the left or to the right,
// so each such corner is checked twice.
class SquareCounter {
    private static final int SIDE = 1001;
    // Multiplicity of every grid point, flattened: point (x, y) lives at x * SIDE + y.
    private final int[] cnt = new int[SIDE * SIDE];
    // Distinct y values seen in each column, so count walks only the column it needs.
    private final List<List<Integer>> cols = new ArrayList<>();

    public SquareCounter() {
        for (int i = 0; i < SIDE; i++) cols.add(new ArrayList<>());
    }

    public void add(int[] point) {
        int x = point[0], y = point[1];
        int k = x * SIDE + y;
        if (cnt[k]++ == 0) cols.get(x).add(y);
    }

    public long count(int[] point) {
        int x = point[0], y = point[1];
        long total = 0;
        for (int y2 : cols.get(x)) {
            int d = y2 - y;
            if (d == 0) continue;
            // long before multiplying: three multiplicities multiply to about 4 * 10^12.
            long here = cnt[x * SIDE + y2];
            for (int x2 : new int[] {x - d, x + d}) {
                if (x2 < 0 || x2 >= SIDE) continue;
                // Copies are distinct choices, so the multiplicities multiply.
                total += here * cnt[x2 * SIDE + y] * cnt[x2 * SIDE + y2];
            }
        }
        return total;
    }
}
