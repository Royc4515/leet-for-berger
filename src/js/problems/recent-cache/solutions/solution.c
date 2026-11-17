// O(1) per call: a table indexed by key finds an entry, and a doubly linked list (threaded
// through the same table by index) keeps entries ordered by last use.
// Keys are at most 10^5, so a direct-address table replaces the hash map C does not have.
#define KEY_SLOTS 100001
// Slot KEY_SLOTS is a placeholder that is both head and tail of a circular list:
// next of it is the most recent entry, prev of it the least recent.
#define SENTINEL KEY_SLOTS

typedef struct {
    int capacity, size;
    int val[KEY_SLOTS + 1];
    int prev[KEY_SLOTS + 1], next[KEY_SLOTS + 1];
    bool present[KEY_SLOTS + 1];
} LruCache;

static void unlinkSlot(LruCache* obj, int k) {
    obj->next[obj->prev[k]] = obj->next[k];
    obj->prev[obj->next[k]] = obj->prev[k];
}

static void pushFront(LruCache* obj, int k) {
    obj->next[k] = obj->next[SENTINEL];
    obj->prev[k] = SENTINEL;
    obj->prev[obj->next[SENTINEL]] = k;
    obj->next[SENTINEL] = k;
}

LruCache* lruCacheCreate(int capacity) {
    // calloc leaves every present flag false.
    LruCache* obj = calloc(1, sizeof(LruCache));
    obj->capacity = capacity;
    obj->next[SENTINEL] = obj->prev[SENTINEL] = SENTINEL;
    return obj;
}

int lruCacheGet(LruCache* obj, int key) {
    if (!obj->present[key]) return -1;
    // A successful read counts as a use, so the entry moves to the front.
    unlinkSlot(obj, key);
    pushFront(obj, key);
    return obj->val[key];
}

void lruCachePut(LruCache* obj, int key, int value) {
    if (obj->present[key]) {
        // Updating an existing key refreshes it but does not grow the cache.
        unlinkSlot(obj, key);
    } else {
        obj->present[key] = true;
        obj->size++;
    }
    obj->val[key] = value;
    pushFront(obj, key);
    if (obj->size > obj->capacity) {
        int lru = obj->prev[SENTINEL];
        unlinkSlot(obj, lru);
        obj->present[lru] = false;
        obj->size--;
    }
}

void lruCacheFree(LruCache* obj) {
    free(obj);
}
