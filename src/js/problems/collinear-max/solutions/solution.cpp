class Solution {
public:
    // O(n^2) time - for each anchor, count the other points per exact direction.
    int maxPoints(vector<vector<int>>& points) {
        int n = points.size();
        if (n <= 2) return n;
        int best = 1;
        for (int i = 0; i < n; i++) {
            unordered_map<int, int> directions;
            for (int j = i + 1; j < n; j++) {
                int dx = points[j][0] - points[i][0];
                int dy = points[j][1] - points[i][1];
                int g = gcd(abs(dx), abs(dy));
                dx /= g;
                dy /= g;
                // One canonical sign per line: (1, -1) and (-1, 1) are the same direction.
                if (dx < 0 || (dx == 0 && dy < 0)) {
                    dx = -dx;
                    dy = -dy;
                }
                best = max(best, ++directions[dx * 40001 + dy] + 1);
            }
        }
        return best;
    }
};
