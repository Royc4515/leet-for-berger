// O(1) per call: one number per message, the earliest time it may be shown again.
// C has no hash map, so messages live in an open-addressing table. At most 10^5 distinct messages
// exist, and 2^18 slots keep the table under half full, so probe runs stay short.
#define TABLE_BITS 18
#define TABLE_SIZE (1 << TABLE_BITS)

typedef struct {
    char* key; // NULL marks an empty slot
    int nextAllowed;
} Entry;

typedef struct {
    Entry* table;
    int cooldown;
} MessageThrottle;

// FNV-1a: cheap and spreads short keys well.
static unsigned hashString(const char* s) {
    unsigned h = 2166136261u;
    for (; *s; s++) h = (h ^ (unsigned char)*s) * 16777619u;
    return h;
}

MessageThrottle* messageThrottleCreate(int cooldown) {
    MessageThrottle* obj = malloc(sizeof(MessageThrottle));
    obj->table = calloc(TABLE_SIZE, sizeof(Entry));
    obj->cooldown = cooldown;
    return obj;
}

bool messageThrottleAllow(MessageThrottle* obj, int timestamp, char* message) {
    unsigned i = hashString(message) & (TABLE_SIZE - 1);
    while (obj->table[i].key && strcmp(obj->table[i].key, message) != 0) i = (i + 1) & (TABLE_SIZE - 1);
    Entry* e = &obj->table[i];
    if (!e->key) {
        // First sighting: keep a private copy, the caller owns the string it passed in.
        size_t n = strlen(message) + 1;
        e->key = malloc(n);
        memcpy(e->key, message, n);
    } else if (timestamp < e->nextAllowed) {
        // Only a shown message moves its time: a refused call must not extend its own ban.
        return false;
    }
    e->nextAllowed = timestamp + obj->cooldown;
    return true;
}

void messageThrottleFree(MessageThrottle* obj) {
    for (int i = 0; i < TABLE_SIZE; i++) free(obj->table[i].key);
    free(obj->table);
    free(obj);
}
