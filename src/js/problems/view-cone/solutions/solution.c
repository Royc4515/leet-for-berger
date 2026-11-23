#include <math.h>

// O(n log n) time - only directions matter: sort the polar angles and slide a window of the
// view's width over them, with every angle repeated + 2 * pi so a view facing west wraps.
static int byAngle(const void* x, const void* y) {
    double a = *(const double*)x, b = *(const double*)y;
    return (a > b) - (a < b);
}

int visiblePoints(int** points, int pointsSize, int* pointsColSize, int angle, int* location, int locationSize) {
    const double PI = acos(-1.0);
    int x = location[0], y = location[1];
    int here = 0, m = 0;
    double* angles = malloc(sizeof(double) * 2 * pointsSize);
    for (int k = 0; k < pointsSize; k++) {
        // A point on the viewer has no direction and is visible whichever way you face.
        if (points[k][0] == x && points[k][1] == y) here++;
        else angles[m++] = atan2(points[k][1] - y, points[k][0] - x);
    }
    qsort(angles, m, sizeof(double), byAngle);
    for (int k = 0; k < m; k++) angles[m + k] = angles[k] + 2 * PI;
    // 1e-9 keeps a point exactly on the edge inside even if atan2 rounds it a hair outside.
    double width = angle * PI / 180 + 1e-9;
    int best = 0;
    for (int i = 0, j = 0; j < 2 * m; j++) {
        while (angles[j] - angles[i] > width) i++;
        if (j - i + 1 > best) best = j - i + 1;
    }
    free(angles);
    // A window never holds the same direction twice.
    return (best < m ? best : m) + here;
}
