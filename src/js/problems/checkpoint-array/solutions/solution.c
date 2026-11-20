// set and snap are O(1), get is O(log w): per slot, only the writes are stored, tagged with the
// checkpoint they were made under. Ids only grow, so each slot's list stays sorted.
typedef struct {
    int* ids;
    int* vals;
    int count, cap;
} Slot;

typedef struct {
    Slot* slots;
    int length;
    int taken;
} CheckpointArray;

CheckpointArray* checkpointArrayCreate(int length) {
    CheckpointArray* obj = malloc(sizeof(CheckpointArray));
    // calloc: every slot starts with no writes.
    obj->slots = calloc(length, sizeof(Slot));
    obj->length = length;
    obj->taken = 0;
    return obj;
}

void checkpointArraySet(CheckpointArray* obj, int index, int val) {
    Slot* s = &obj->slots[index];
    // A second write inside the same checkpoint replaces the first one.
    if (s->count > 0 && s->ids[s->count - 1] == obj->taken) {
        s->vals[s->count - 1] = val;
        return;
    }
    if (s->count == s->cap) {
        s->cap = s->cap ? s->cap * 2 : 2;
        s->ids = realloc(s->ids, sizeof(int) * s->cap);
        s->vals = realloc(s->vals, sizeof(int) * s->cap);
    }
    s->ids[s->count] = obj->taken;
    s->vals[s->count] = val;
    s->count++;
}

int checkpointArraySnap(CheckpointArray* obj) {
    return obj->taken++;
}

int checkpointArrayGet(CheckpointArray* obj, int index, int snapId) {
    Slot* s = &obj->slots[index];
    // Find the first write made under an id > snapId; the one before it is the answer.
    int lo = 0, hi = s->count;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (s->ids[mid] <= snapId) lo = mid + 1;
        else hi = mid;
    }
    return lo == 0 ? 0 : s->vals[lo - 1];
}

void checkpointArrayFree(CheckpointArray* obj) {
    for (int i = 0; i < obj->length; i++) {
        free(obj->slots[i].ids);
        free(obj->slots[i].vals);
    }
    free(obj->slots);
    free(obj);
}
