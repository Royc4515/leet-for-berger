// O(1) per add; per count, O(distinct points in the query's column). A corner on the query's
// vertical line fixes the side length d, and the square lies either to the left or to the right,
// so each such corner is checked twice.
public class SquareCounter {
    private const int Side = 1001;
    // Multiplicity of every grid point, flattened: point (x, y) lives at x * Side + y.
    private readonly int[] cnt = new int[Side * Side];
    // Distinct y values seen in each column, so Count walks only the column it needs.
    private readonly List<int>[] cols = new List<int>[Side];

    public SquareCounter() {
        for (int i = 0; i < Side; i++) cols[i] = new List<int>();
    }

    public void Add(int[] point) {
        int x = point[0], y = point[1];
        int k = x * Side + y;
        if (cnt[k]++ == 0) cols[x].Add(y);
    }

    public long Count(int[] point) {
        int x = point[0], y = point[1];
        long total = 0;
        foreach (int y2 in cols[x]) {
            int d = y2 - y;
            if (d == 0) continue;
            // long before multiplying: three multiplicities multiply to about 4 * 10^12.
            long here = cnt[x * Side + y2];
            foreach (int x2 in new[] { x - d, x + d }) {
                if (x2 < 0 || x2 >= Side) continue;
                // Copies are distinct choices, so the multiplicities multiply.
                total += here * cnt[x2 * Side + y] * cnt[x2 * Side + y2];
            }
        }
        return total;
    }
}
