// O(1) average per call: separate chaining. 2^17 buckets keep the chains short for up to
// 2 * 10^5 keys; a flag per possible key would need 10^9 entries.
#define BITS 17

typedef struct Node {
    int key;
    struct Node* next;
} Node;

typedef struct {
    Node* buckets[1 << BITS];
} MyHashSet;

// Multiplicative hashing: the top bits of the product depend on every bit of the key, so
// multiples of 1024 do not pile into a few buckets as key % 2^17 would.
static unsigned bucketIndex(int key) {
    return ((unsigned)key * 2654435761u) >> (32 - BITS);
}

MyHashSet* myHashSetCreate() {
    // calloc leaves every bucket empty (NULL).
    return calloc(1, sizeof(MyHashSet));
}

bool myHashSetContains(MyHashSet* obj, int key) {
    for (Node* n = obj->buckets[bucketIndex(key)]; n; n = n->next) {
        if (n->key == key) return true;
    }
    return false;
}

void myHashSetAdd(MyHashSet* obj, int key) {
    // Store each key once, so a single remove really takes it out.
    if (myHashSetContains(obj, key)) return;
    Node** head = &obj->buckets[bucketIndex(key)];
    Node* n = malloc(sizeof(Node));
    n->key = key;
    n->next = *head;
    *head = n;
}

void myHashSetRemove(MyHashSet* obj, int key) {
    // Walking a pointer to the link itself makes removing the first node no special case.
    for (Node** link = &obj->buckets[bucketIndex(key)]; *link; link = &(*link)->next) {
        if ((*link)->key == key) {
            Node* dead = *link;
            *link = dead->next;
            free(dead);
            return;
        }
    }
}

void myHashSetFree(MyHashSet* obj) {
    for (int i = 0; i < (1 << BITS); i++) {
        for (Node* n = obj->buckets[i]; n;) {
            Node* next = n->next;
            free(n);
            n = next;
        }
    }
    free(obj);
}
