// O(1) average per call: separate chaining. 2^17 buckets keep the chains short for up to
// 2 * 10^5 keys.
#define BITS 17

typedef struct Entry {
    int key, value;
    struct Entry* next;
} Entry;

typedef struct {
    Entry* buckets[1 << BITS];
} MyHashMap;

// Multiplicative hashing: the top bits of the product depend on every bit of the key, so
// multiples of 1024 do not pile into a few buckets as key % 2^17 would.
static unsigned bucketIndex(int key) {
    return ((unsigned)key * 2654435761u) >> (32 - BITS);
}

MyHashMap* myHashMapCreate() {
    // calloc leaves every bucket empty (NULL).
    return calloc(1, sizeof(MyHashMap));
}

void myHashMapPut(MyHashMap* obj, int key, int value) {
    Entry** head = &obj->buckets[bucketIndex(key)];
    for (Entry* e = *head; e; e = e->next) {
        if (e->key == key) {
            // Update in place: adding a second entry would leave a stale copy behind.
            e->value = value;
            return;
        }
    }
    Entry* e = malloc(sizeof(Entry));
    e->key = key;
    e->value = value;
    e->next = *head;
    *head = e;
}

int myHashMapGet(MyHashMap* obj, int key) {
    for (Entry* e = obj->buckets[bucketIndex(key)]; e; e = e->next) {
        if (e->key == key) return e->value;
    }
    return -1;
}

void myHashMapRemove(MyHashMap* obj, int key) {
    // Walking a pointer to the link itself makes removing the first entry no special case.
    for (Entry** link = &obj->buckets[bucketIndex(key)]; *link; link = &(*link)->next) {
        if ((*link)->key == key) {
            Entry* dead = *link;
            *link = dead->next;
            free(dead);
            return;
        }
    }
}

void myHashMapFree(MyHashMap* obj) {
    for (int i = 0; i < (1 << BITS); i++) {
        for (Entry* e = obj->buckets[i]; e;) {
            Entry* next = e->next;
            free(e);
            e = next;
        }
    }
    free(obj);
}
