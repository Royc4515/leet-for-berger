public class Solution {
    // O(n^2) time - for each anchor, count the other points per exact direction.
    public int MaxPoints(int[][] points) {
        int n = points.Length;
        if (n <= 2) return n;
        int best = 1;
        for (int i = 0; i < n; i++) {
            var directions = new Dictionary<int, int>();
            for (int j = i + 1; j < n; j++) {
                int dx = points[j][0] - points[i][0];
                int dy = points[j][1] - points[i][1];
                int g = Gcd(Math.Abs(dx), Math.Abs(dy));
                dx /= g;
                dy /= g;
                // One canonical sign per line: (1, -1) and (-1, 1) are the same direction.
                if (dx < 0 || (dx == 0 && dy < 0)) {
                    dx = -dx;
                    dy = -dy;
                }
                int key = dx * 40001 + dy;
                directions.TryGetValue(key, out int count);
                directions[key] = ++count;
                best = Math.Max(best, count + 1);
            }
        }
        return best;
    }

    private static int Gcd(int a, int b) {
        while (b != 0) (a, b) = (b, a % b);
        return a;
    }
}
