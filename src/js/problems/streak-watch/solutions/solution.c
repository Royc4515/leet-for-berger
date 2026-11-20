// O(1) per call: one counter holds the length of the current run of target readings.
typedef struct {
    int target;
    int k;
    int run;
} StreakWatch;

StreakWatch* streakWatchCreate(int target, int k) {
    StreakWatch* obj = malloc(sizeof(StreakWatch));
    obj->target = target;
    obj->k = k;
    obj->run = 0;
    return obj;
}

bool streakWatchObserve(StreakWatch* obj, int reading) {
    // Any other value breaks the run; the last k readings are all the target exactly when the
    // run is at least k long (a longer run keeps answering true).
    obj->run = reading == obj->target ? obj->run + 1 : 0;
    return obj->run >= obj->k;
}

void streakWatchFree(StreakWatch* obj) {
    free(obj);
}
