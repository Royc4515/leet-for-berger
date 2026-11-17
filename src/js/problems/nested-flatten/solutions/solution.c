// O(1) amortized per call, O(depth) space: an explicit stack replaces the recursion, and each list
// item is visited once over the whole run.
typedef struct {
    // Each frame is a list, its length and the index of its next unread item.
    struct NestedInteger*** lists;
    int* sizes;
    int* pos;
    int depth;
    int cap;
} NestedIterator;

static void nestedIteratorPush(NestedIterator* obj, struct NestedInteger** list, int size) {
    if (obj->depth == obj->cap) {
        obj->cap *= 2;
        obj->lists = realloc(obj->lists, sizeof(struct NestedInteger**) * obj->cap);
        obj->sizes = realloc(obj->sizes, sizeof(int) * obj->cap);
        obj->pos = realloc(obj->pos, sizeof(int) * obj->cap);
    }
    obj->lists[obj->depth] = list;
    obj->sizes[obj->depth] = size;
    obj->pos[obj->depth] = 0;
    obj->depth++;
}

NestedIterator* nestedIteratorCreate(struct NestedInteger** nestedList, int nestedListSize) {
    NestedIterator* obj = malloc(sizeof(NestedIterator));
    obj->cap = 16;
    obj->depth = 0;
    obj->lists = malloc(sizeof(struct NestedInteger**) * obj->cap);
    obj->sizes = malloc(sizeof(int) * obj->cap);
    obj->pos = malloc(sizeof(int) * obj->cap);
    nestedIteratorPush(obj, nestedList, nestedListSize);
    return obj;
}

// Settles on the next integer without consuming it, so calling this twice changes nothing.
bool nestedIteratorHasNext(NestedIterator* obj) {
    while (obj->depth > 0) {
        int top = obj->depth - 1;
        if (obj->pos[top] == obj->sizes[top]) {
            obj->depth--;
            continue;
        }
        struct NestedInteger* item = obj->lists[top][obj->pos[top]];
        if (nestedIntegerIsInteger(item)) return true;
        obj->pos[top]++;
        nestedIteratorPush(obj, nestedIntegerGetList(item), nestedIntegerGetListSize(item));
    }
    return false;
}

int nestedIteratorNext(NestedIterator* obj) {
    nestedIteratorHasNext(obj);
    int top = obj->depth - 1;
    return nestedIntegerGetInteger(obj->lists[top][obj->pos[top]++]);
}

void nestedIteratorFree(NestedIterator* obj) {
    free(obj->lists);
    free(obj->sizes);
    free(obj->pos);
    free(obj);
}
