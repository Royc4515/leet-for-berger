// O(1) per call: one fixed array, the index of the front item and the item count. Keeping the
// count (instead of a tail index) tells empty from full without wasting a slot.
typedef struct {
    int* data;
    int cap;
    int head;
    int size;
} RingQueue;

RingQueue* ringQueueCreate(int capacity) {
    RingQueue* obj = malloc(sizeof(RingQueue));
    obj->data = malloc(sizeof(int) * capacity);
    obj->cap = capacity;
    obj->head = 0;
    obj->size = 0;
    return obj;
}

bool ringQueuePush(RingQueue* obj, int value) {
    if (obj->size == obj->cap) return false;
    // The next free slot is `size` steps after the front, wrapping past the end of the array.
    obj->data[(obj->head + obj->size) % obj->cap] = value;
    obj->size++;
    return true;
}

bool ringQueuePop(RingQueue* obj) {
    if (obj->size == 0) return false;
    obj->head = (obj->head + 1) % obj->cap;
    obj->size--;
    return true;
}

int ringQueueFront(RingQueue* obj) {
    return obj->size == 0 ? -1 : obj->data[obj->head];
}

int ringQueueBack(RingQueue* obj) {
    return obj->size == 0 ? -1 : obj->data[(obj->head + obj->size - 1) % obj->cap];
}

bool ringQueueIsEmpty(RingQueue* obj) {
    return obj->size == 0;
}

bool ringQueueIsFull(RingQueue* obj) {
    return obj->size == obj->cap;
}

void ringQueueFree(RingQueue* obj) {
    free(obj->data);
    free(obj);
}
