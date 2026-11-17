// O(n log n) time - only the order of start and end events matters, not which meeting owns them.
static int ascending(const void* x, const void* y) {
    int a = *(const int*)x, b = *(const int*)y;
    // Comparisons instead of a - b, which is the habit that avoids overflow bugs.
    return (a > b) - (a < b);
}

int minMeetingRooms(int** intervals, int intervalsSize, int* intervalsColSize) {
    int* starts = malloc(sizeof(int) * intervalsSize);
    int* ends = malloc(sizeof(int) * intervalsSize);
    for (int i = 0; i < intervalsSize; i++) {
        starts[i] = intervals[i][0];
        ends[i] = intervals[i][1];
    }
    qsort(starts, intervalsSize, sizeof(int), ascending);
    qsort(ends, intervalsSize, sizeof(int), ascending);
    int rooms = 0, e = 0;
    for (int i = 0; i < intervalsSize; i++) {
        // ends[e] is the earliest time a busy room frees up. `<` because a meeting ending at
        // starts[i] has already left its room, so the new meeting can take it.
        if (starts[i] < ends[e]) rooms++;
        else e++;
    }
    free(starts);
    free(ends);
    return rooms;
}
