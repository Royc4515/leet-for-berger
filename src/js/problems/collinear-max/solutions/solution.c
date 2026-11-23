// O(n^2 log n) time - for each anchor, the exact directions to the later points are sorted so
// equal ones sit together; C has no hash map, and with n <= 300 sorting is just as fast.
static int collinearGcd(int a, int b) {
    while (b != 0) {
        int t = a % b;
        a = b;
        b = t;
    }
    return a;
}

static int byKey(const void* x, const void* y) {
    int a = *(const int*)x, b = *(const int*)y;
    return (a > b) - (a < b);
}

int maxPoints(int** points, int pointsSize, int* pointsColSize) {
    if (pointsSize <= 2) return pointsSize;
    int* keys = malloc(sizeof(int) * pointsSize);
    int best = 1;
    for (int i = 0; i < pointsSize; i++) {
        int m = 0;
        for (int j = i + 1; j < pointsSize; j++) {
            int dx = points[j][0] - points[i][0];
            int dy = points[j][1] - points[i][1];
            int g = collinearGcd(abs(dx), abs(dy));
            dx /= g;
            dy /= g;
            // One canonical sign per line: (1, -1) and (-1, 1) are the same direction.
            if (dx < 0 || (dx == 0 && dy < 0)) {
                dx = -dx;
                dy = -dy;
            }
            keys[m++] = dx * 40001 + dy;
        }
        qsort(keys, m, sizeof(int), byKey);
        for (int a = 0, b = 0; a < m; a = b) {
            while (b < m && keys[b] == keys[a]) b++;
            if (b - a + 1 > best) best = b - a + 1;
        }
    }
    free(keys);
    return best;
}
