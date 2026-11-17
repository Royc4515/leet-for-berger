// O(1) per add; per count, O(distinct points in the query's column). A corner on the query's
// vertical line fixes the side length d, and the square lies either to the left or to the right,
// so each such corner is checked twice.
class SquareCounter {
public:
    SquareCounter() : cnt(SIDE * SIDE, 0), cols(SIDE) {
    }

    void add(vector<int>& point) {
        int x = point[0], y = point[1];
        int k = x * SIDE + y;
        if (cnt[k]++ == 0) cols[x].push_back(y);
    }

    long long count(vector<int>& point) {
        int x = point[0], y = point[1];
        long long total = 0;
        for (int y2 : cols[x]) {
            int d = y2 - y;
            if (d == 0) continue;
            // long long before multiplying: three multiplicities multiply to about 4 * 10^12.
            long long here = cnt[x * SIDE + y2];
            for (int x2 : {x - d, x + d}) {
                if (x2 < 0 || x2 >= SIDE) continue;
                // Copies are distinct choices, so the multiplicities multiply.
                total += here * cnt[x2 * SIDE + y] * cnt[x2 * SIDE + y2];
            }
        }
        return total;
    }

private:
    static const int SIDE = 1001;
    // Multiplicity of every grid point, flattened: point (x, y) lives at x * SIDE + y.
    vector<int> cnt;
    // Distinct y values seen in each column, so count walks only the column it needs.
    vector<vector<int>> cols;
};
