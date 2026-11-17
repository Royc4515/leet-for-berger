// Pre-order with "#" for missing children: O(n) per call. The read position is a local passed
// down by pointer, never stored in the codec, so every deserialize call starts at the beginning.
typedef struct {
    int unused; // C needs at least one member; the codec itself keeps no state.
} Codec;

typedef struct {
    char* s;
    size_t len, cap;
} Buffer;

static void bufferPut(Buffer* b, const char* text) {
    size_t n = strlen(text);
    // Doubling the capacity keeps appends amortized O(1), so serializing stays linear.
    while (b->len + n + 1 > b->cap) {
        b->cap = b->cap ? b->cap * 2 : 64;
        b->s = realloc(b->s, b->cap);
    }
    memcpy(b->s + b->len, text, n + 1);
    b->len += n;
}

static void walk(struct TreeNode* node, Buffer* b) {
    if (b->len) bufferPut(b, ",");
    if (!node) {
        bufferPut(b, "#");
        return;
    }
    char num[16];
    snprintf(num, sizeof num, "%d", node->val);
    bufferPut(b, num);
    walk(node->left, b);
    walk(node->right, b);
}

static struct TreeNode* build(const char** p) {
    const char* s = *p;
    struct TreeNode* node = NULL;
    if (*s == '#') {
        s++;
    } else {
        char* end;
        node = malloc(sizeof(struct TreeNode));
        node->val = (int)strtol(s, &end, 10);
        s = end;
    }
    if (*s == ',') s++;
    *p = s;
    if (node) {
        // Pre-order: the whole left subtree comes before the right one.
        node->left = build(p);
        node->right = build(p);
    }
    return node;
}

Codec* codecCreate() {
    return calloc(1, sizeof(Codec));
}

char* codecSerialize(Codec* obj, struct TreeNode* root) {
    (void)obj;
    Buffer b = {NULL, 0, 0};
    walk(root, &b);
    return b.s;
}

struct TreeNode* codecDeserialize(Codec* obj, char* data) {
    (void)obj;
    const char* p = data;
    return build(&p);
}

void codecFree(Codec* obj) {
    free(obj);
}
