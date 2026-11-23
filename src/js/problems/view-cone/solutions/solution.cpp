class Solution {
public:
    // O(n log n) time - only directions matter: sort the polar angles and slide a window of the
    // view's width over them, with every angle repeated + 2 * pi so a view facing west wraps.
    int visiblePoints(vector<vector<int>>& points, int angle, vector<int>& location) {
        const double PI = acos(-1.0);
        int x = location[0], y = location[1];
        int here = 0;
        vector<double> angles;
        for (auto& p : points) {
            // A point on the viewer has no direction and is visible whichever way you face.
            if (p[0] == x && p[1] == y) here++;
            else angles.push_back(atan2(p[1] - y, p[0] - x));
        }
        sort(angles.begin(), angles.end());
        int m = angles.size();
        for (int i = 0; i < m; i++) angles.push_back(angles[i] + 2 * PI);
        // 1e-9 keeps a point exactly on the edge inside even if atan2 rounds it a hair outside.
        double width = angle * PI / 180 + 1e-9;
        int best = 0;
        for (int i = 0, j = 0; j < 2 * m; j++) {
            while (angles[j] - angles[i] > width) i++;
            best = max(best, j - i + 1);
        }
        // min(..., m): a window never holds the same direction twice.
        return min(best, m) + here;
    }
};
