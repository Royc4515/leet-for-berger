import java.util.*;

class Solution {
    // O(n log n) time - only directions matter: sort the polar angles and slide a window of the
    // view's width over them, with every angle repeated + 2 * pi so a view facing west wraps.
    public int visiblePoints(int[][] points, int angle, int[] location) {
        int x = location[0], y = location[1];
        int here = 0;
        double[] buf = new double[points.length];
        int m = 0;
        for (int[] p : points) {
            // A point on the viewer has no direction and is visible whichever way you face.
            if (p[0] == x && p[1] == y) here++;
            else buf[m++] = Math.atan2(p[1] - y, p[0] - x);
        }
        double[] angles = new double[2 * m];
        System.arraycopy(buf, 0, angles, 0, m);
        Arrays.sort(angles, 0, m);
        for (int i = 0; i < m; i++) angles[m + i] = angles[i] + 2 * Math.PI;
        // 1e-9 keeps a point exactly on the edge inside even if atan2 rounds it a hair outside.
        double width = angle * Math.PI / 180 + 1e-9;
        int best = 0;
        for (int i = 0, j = 0; j < 2 * m; j++) {
            while (angles[j] - angles[i] > width) i++;
            best = Math.max(best, j - i + 1);
        }
        // Math.min(..., m): a window never holds the same direction twice.
        return Math.min(best, m) + here;
    }
}
