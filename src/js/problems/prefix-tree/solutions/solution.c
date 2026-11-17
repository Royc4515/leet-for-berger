// O(length of the argument) per call. Nodes live in one growable array and refer to their
// children by index (0 means "no child", since node 0 is the root and is never anyone's child).
typedef struct {
    int next[26];
    bool isEnd;
} TrieNode;

typedef struct {
    TrieNode* nodes;
    int count, cap;
} Trie;

Trie* trieCreate() {
    Trie* obj = malloc(sizeof(Trie));
    obj->cap = 1024;
    obj->nodes = calloc(obj->cap, sizeof(TrieNode));
    obj->count = 1; // the root
    return obj;
}

static int newNode(Trie* obj) {
    if (obj->count == obj->cap) {
        obj->nodes = realloc(obj->nodes, sizeof(TrieNode) * obj->cap * 2);
        // realloc does not zero the new half, and a zero child index means "no child".
        memset(obj->nodes + obj->cap, 0, sizeof(TrieNode) * obj->cap);
        obj->cap *= 2;
    }
    return obj->count++;
}

void trieInsert(Trie* obj, char* word) {
    int node = 0;
    for (; *word; word++) {
        int c = *word - 'a';
        if (!obj->nodes[node].next[c]) {
            // Read the index first: newNode may move the array, invalidating pointers into it.
            int child = newNode(obj);
            obj->nodes[node].next[c] = child;
        }
        node = obj->nodes[node].next[c];
    }
    obj->nodes[node].isEnd = true;
}

// Index of the node for prefix s, or -1 if no inserted word starts with s.
static int walk(Trie* obj, const char* s) {
    int node = 0;
    for (; *s; s++) {
        node = obj->nodes[node].next[*s - 'a'];
        if (!node) return -1;
    }
    return node;
}

bool trieSearch(Trie* obj, char* word) {
    int node = walk(obj, word);
    // The path existing is not enough: "app" exists inside "apple" without being a word.
    return node >= 0 && obj->nodes[node].isEnd;
}

bool trieStartsWith(Trie* obj, char* prefix) {
    return walk(obj, prefix) >= 0;
}

void trieFree(Trie* obj) {
    free(obj->nodes);
    free(obj);
}
