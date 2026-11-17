// O(1) per call: for every use count, a circular doubly linked list of the keys with that count
// in recency order (newest right after the list's placeholder), plus the smallest count that
// still has keys. Keys are at most 10^5, so a direct-address table replaces a hash map, and
// lists are threaded through it by index.
#define KEY_SLOTS 100001
// Each call adds at most one use, so with 2 * 10^5 calls no count exceeds 200001.
#define MAX_COUNT 200001
// Slot KEY_SLOTS + c is the placeholder of the list for count c.
#define SLOTS (KEY_SLOTS + MAX_COUNT + 1)

typedef struct {
    int capacity, size, minCount;
    int val[KEY_SLOTS], count[KEY_SLOTS];
    bool present[KEY_SLOTS];
    int prev[SLOTS], next[SLOTS];
} LfuCache;

static void unlinkSlot(LfuCache* obj, int k) {
    obj->next[obj->prev[k]] = obj->next[k];
    obj->prev[obj->next[k]] = obj->prev[k];
}

static void pushFront(LfuCache* obj, int k, int c) {
    int s = KEY_SLOTS + c;
    obj->next[k] = obj->next[s];
    obj->prev[k] = s;
    obj->prev[obj->next[s]] = k;
    obj->next[s] = k;
}

static bool listEmpty(LfuCache* obj, int c) {
    return obj->next[KEY_SLOTS + c] == KEY_SLOTS + c;
}

// Moves a key from the list for its count to the list for count + 1.
static void touch(LfuCache* obj, int key) {
    int c = obj->count[key];
    unlinkSlot(obj, key);
    // The key was the last one with the smallest count, and it now has count + 1.
    if (obj->minCount == c && listEmpty(obj, c)) obj->minCount++;
    obj->count[key] = c + 1;
    pushFront(obj, key, c + 1);
}

LfuCache* lfuCacheCreate(int capacity) {
    // calloc leaves every present flag false.
    LfuCache* obj = calloc(1, sizeof(LfuCache));
    obj->capacity = capacity;
    for (int c = 0; c <= MAX_COUNT; c++) obj->next[KEY_SLOTS + c] = obj->prev[KEY_SLOTS + c] = KEY_SLOTS + c;
    return obj;
}

int lfuCacheGet(LfuCache* obj, int key) {
    if (!obj->present[key]) return -1;
    touch(obj, key);
    return obj->val[key];
}

void lfuCachePut(LfuCache* obj, int key, int value) {
    if (obj->present[key]) {
        // Storing over an existing key is a use as well.
        obj->val[key] = value;
        touch(obj, key);
        return;
    }
    if (obj->size == obj->capacity) {
        // The oldest key among those with the smallest count is the last one in its list.
        int victim = obj->prev[KEY_SLOTS + obj->minCount];
        unlinkSlot(obj, victim);
        obj->present[victim] = false;
        obj->size--;
    }
    obj->present[key] = true;
    obj->size++;
    obj->val[key] = value;
    obj->count[key] = 1;
    pushFront(obj, key, 1);
    // A new key always has the smallest possible count.
    obj->minCount = 1;
}

void lfuCacheFree(LfuCache* obj) {
    free(obj);
}
