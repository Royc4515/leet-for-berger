// O(1) average per operation: the values sit in a dense array for uniform picks, and a hash table
// from value to array index makes membership and removal constant time. C has no hash map, so this
// is a small open-addressing table with linear probing.
typedef struct {
    int* values;    // dense array of the members
    int size;
    int valuesCap;
    int* keys;      // hash table: keys[slot] is a member, at[slot] its index in values, -1 = empty
    int* at;
    unsigned mask;
} RandomizedSet;

static unsigned rsHash(int key) {
    unsigned h = (unsigned)key * 2654435761u;
    return h ^ (h >> 16);
}

// The slot holding key, or the empty slot where it would go.
static unsigned rsSlot(RandomizedSet* obj, int key) {
    unsigned i = rsHash(key) & obj->mask;
    while (obj->at[i] != -1 && obj->keys[i] != key) i = (i + 1) & obj->mask;
    return i;
}

static void rsAlloc(RandomizedSet* obj, unsigned slots) {
    obj->mask = slots - 1;
    obj->keys = malloc(sizeof(int) * slots);
    obj->at = malloc(sizeof(int) * slots);
    for (unsigned i = 0; i < slots; i++) obj->at[i] = -1;
}

static void rsGrow(RandomizedSet* obj) {
    int* oldKeys = obj->keys;
    int* oldAt = obj->at;
    unsigned oldSlots = obj->mask + 1;
    rsAlloc(obj, oldSlots * 2);
    for (unsigned i = 0; i < oldSlots; i++) {
        if (oldAt[i] == -1) continue;
        unsigned s = rsSlot(obj, oldKeys[i]);
        obj->keys[s] = oldKeys[i];
        obj->at[s] = oldAt[i];
    }
    free(oldKeys);
    free(oldAt);
}

RandomizedSet* randomizedSetCreate() {
    RandomizedSet* obj = malloc(sizeof(RandomizedSet));
    obj->size = 0;
    obj->valuesCap = 16;
    obj->values = malloc(sizeof(int) * obj->valuesCap);
    rsAlloc(obj, 32);
    return obj;
}

bool randomizedSetInsert(RandomizedSet* obj, int val) {
    unsigned s = rsSlot(obj, val);
    if (obj->at[s] != -1) return false;
    if (obj->size == obj->valuesCap) {
        obj->valuesCap *= 2;
        obj->values = realloc(obj->values, sizeof(int) * obj->valuesCap);
    }
    obj->keys[s] = val;
    obj->at[s] = obj->size;
    obj->values[obj->size++] = val;
    // Keep the table at most half full so probe runs stay short.
    if ((unsigned)obj->size * 2 > obj->mask + 1) rsGrow(obj);
    return true;
}

bool randomizedSetRemove(RandomizedSet* obj, int val) {
    unsigned i = rsSlot(obj, val);
    if (obj->at[i] == -1) return false;
    int idx = obj->at[i];
    // Order does not matter, so the last value fills the hole and the array stays dense.
    int last = obj->values[--obj->size];
    if (idx < obj->size) {
        obj->values[idx] = last;
        obj->at[rsSlot(obj, last)] = idx;
    }
    // Backward-shift deletion: pull later entries of the probe run into the gap, so lookups never
    // stop early at a hole and no tombstones pile up.
    unsigned j = i;
    for (;;) {
        obj->at[i] = -1;
        for (;;) {
            j = (j + 1) & obj->mask;
            if (obj->at[j] == -1) return true;
            unsigned k = rsHash(obj->keys[j]) & obj->mask;
            bool stays = i <= j ? (i < k && k <= j) : (i < k || k <= j);
            if (!stays) break;
        }
        obj->keys[i] = obj->keys[j];
        obj->at[i] = obj->at[j];
        i = j;
    }
}

int randomizedSetGetRandom(RandomizedSet* obj) {
    return obj->values[rand() % obj->size];
}

void randomizedSetFree(RandomizedSet* obj) {
    free(obj->values);
    free(obj->keys);
    free(obj->at);
    free(obj);
}
