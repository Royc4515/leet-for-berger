import java.util.*;

class Solution {
    // O(n^2) time - for each anchor, count the other points per exact direction.
    public int maxPoints(int[][] points) {
        int n = points.length;
        if (n <= 2) return n;
        int best = 1;
        for (int i = 0; i < n; i++) {
            // Integer keys, not Double slopes: a Double key keeps -0.0 and 0.0 apart.
            Map<Integer, Integer> directions = new HashMap<>();
            for (int j = i + 1; j < n; j++) {
                int dx = points[j][0] - points[i][0];
                int dy = points[j][1] - points[i][1];
                int g = gcd(Math.abs(dx), Math.abs(dy));
                dx /= g;
                dy /= g;
                // One canonical sign per line: (1, -1) and (-1, 1) are the same direction.
                if (dx < 0 || (dx == 0 && dy < 0)) {
                    dx = -dx;
                    dy = -dy;
                }
                int count = directions.merge(dx * 40001 + dy, 1, Integer::sum);
                best = Math.max(best, count + 1);
            }
        }
        return best;
    }

    private int gcd(int a, int b) {
        while (b != 0) {
            int t = a % b;
            a = b;
            b = t;
        }
        return a;
    }
}
