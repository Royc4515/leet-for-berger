// O(1) per set, O(log n) per get: set timestamps only increase, so appending keeps each key's
// versions sorted by time and a get is one binary search.
// C has no hash map, so keys live in an open-addressing table. At most 2 * 10^5 keys exist, and
// 2^19 slots keep the table under half full, so probe runs stay short.
#define TABLE_BITS 19
#define TABLE_SIZE (1 << TABLE_BITS)

typedef struct {
    char* key; // NULL marks an empty slot
    int* times;
    char** values;
    int count, cap;
} Slot;

typedef struct {
    Slot* slots;
} TimeMap;

// Copies a string: strdup is not part of C11.
static char* copyString(const char* s) {
    size_t n = strlen(s) + 1;
    char* d = malloc(n);
    memcpy(d, s, n);
    return d;
}

// FNV-1a: cheap and spreads short keys well.
static unsigned hashString(const char* s) {
    unsigned h = 2166136261u;
    for (; *s; s++) h = (h ^ (unsigned char)*s) * 16777619u;
    return h;
}

// The slot holding `key`, or the empty slot where it would go.
static Slot* findSlot(TimeMap* obj, const char* key) {
    unsigned i = hashString(key) & (TABLE_SIZE - 1);
    while (obj->slots[i].key && strcmp(obj->slots[i].key, key) != 0) i = (i + 1) & (TABLE_SIZE - 1);
    return &obj->slots[i];
}

TimeMap* timeMapCreate() {
    TimeMap* obj = malloc(sizeof(TimeMap));
    obj->slots = calloc(TABLE_SIZE, sizeof(Slot));
    return obj;
}

void timeMapSet(TimeMap* obj, char* key, char* value, int timestamp) {
    Slot* s = findSlot(obj, key);
    if (!s->key) s->key = copyString(key);
    if (s->count == s->cap) {
        s->cap = s->cap ? s->cap * 2 : 4;
        s->times = realloc(s->times, sizeof(int) * s->cap);
        s->values = realloc(s->values, sizeof(char*) * s->cap);
    }
    s->times[s->count] = timestamp;
    // Keep a private copy: the caller owns the string it passed in.
    s->values[s->count] = copyString(value);
    s->count++;
}

char* timeMapGet(TimeMap* obj, char* key, int timestamp) {
    static char empty[] = "";
    Slot* s = findSlot(obj, key);
    if (!s->key) return empty;
    // The first version stamped after `timestamp`; the answer is the one just before it.
    int lo = 0, hi = s->count;
    while (lo < hi) {
        int mid = (lo + hi) / 2;
        if (s->times[mid] <= timestamp) lo = mid + 1;
        else hi = mid;
    }
    // The returned string stays owned by the map; the caller must not free it.
    return lo == 0 ? empty : s->values[lo - 1];
}

void timeMapFree(TimeMap* obj) {
    for (int i = 0; i < TABLE_SIZE; i++) {
        Slot* s = &obj->slots[i];
        if (!s->key) continue;
        for (int j = 0; j < s->count; j++) free(s->values[j]);
        free(s->times);
        free(s->values);
        free(s->key);
    }
    free(obj->slots);
    free(obj);
}
