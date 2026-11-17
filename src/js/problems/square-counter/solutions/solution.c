// O(1) per add; per count, O(distinct points in the query's column). A corner on the query's
// vertical line fixes the side length d, and the square lies either to the left or to the right,
// so each such corner is checked twice.
#define SQ_SIDE 1001

typedef struct {
    // Multiplicity of every grid point, flattened: point (x, y) lives at x * SQ_SIDE + y.
    int* cnt;
    // Distinct y values seen in each column (a growable array per column), so count walks only
    // the column it needs.
    int* col[SQ_SIDE];
    int colSize[SQ_SIDE];
    int colCap[SQ_SIDE];
} SquareCounter;

SquareCounter* squareCounterCreate() {
    // calloc zeroes the column pointers and sizes as well as the struct.
    SquareCounter* obj = calloc(1, sizeof(SquareCounter));
    obj->cnt = calloc(SQ_SIDE * SQ_SIDE, sizeof(int));
    return obj;
}

void squareCounterAdd(SquareCounter* obj, int* point, int pointSize) {
    int x = point[0], y = point[1];
    int k = x * SQ_SIDE + y;
    if (obj->cnt[k]++ == 0) {
        if (obj->colSize[x] == obj->colCap[x]) {
            obj->colCap[x] = obj->colCap[x] ? obj->colCap[x] * 2 : 8;
            obj->col[x] = realloc(obj->col[x], sizeof(int) * obj->colCap[x]);
        }
        obj->col[x][obj->colSize[x]++] = y;
    }
}

long long squareCounterCount(SquareCounter* obj, int* point, int pointSize) {
    int x = point[0], y = point[1];
    long long total = 0;
    for (int i = 0; i < obj->colSize[x]; i++) {
        int y2 = obj->col[x][i];
        int d = y2 - y;
        if (d == 0) continue;
        // long long before multiplying: three multiplicities multiply to about 4 * 10^12.
        long long here = obj->cnt[x * SQ_SIDE + y2];
        int sides[2] = {x - d, x + d};
        for (int s = 0; s < 2; s++) {
            int x2 = sides[s];
            if (x2 < 0 || x2 >= SQ_SIDE) continue;
            // Copies are distinct choices, so the multiplicities multiply.
            total += here * obj->cnt[x2 * SQ_SIDE + y] * obj->cnt[x2 * SQ_SIDE + y2];
        }
    }
    return total;
}

void squareCounterFree(SquareCounter* obj) {
    for (int i = 0; i < SQ_SIDE; i++) free(obj->col[i]);
    free(obj->cnt);
    free(obj);
}
