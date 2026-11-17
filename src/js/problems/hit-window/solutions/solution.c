// O(1) amortized per hit, O(1) amortized per query: timestamps never decrease, so hits form a
// queue in time order. A query drops hits that have left the window from the front; they can
// never count again because later queries only look further ahead.
typedef struct {
    int* ts;
    int head, tail, cap;
} HitCounter;

HitCounter* hitCounterCreate() {
    HitCounter* obj = malloc(sizeof(HitCounter));
    obj->cap = 16;
    obj->ts = malloc(sizeof(int) * obj->cap);
    obj->head = obj->tail = 0;
    return obj;
}

void hitCounterHit(HitCounter* obj, int timestamp) {
    if (obj->tail == obj->cap) {
        // Slide the live part to the front before growing, so dropped hits free their space.
        int live = obj->tail - obj->head;
        memmove(obj->ts, obj->ts + obj->head, sizeof(int) * live);
        obj->head = 0;
        obj->tail = live;
        if (live * 2 > obj->cap) {
            obj->cap *= 2;
            obj->ts = realloc(obj->ts, sizeof(int) * obj->cap);
        }
    }
    obj->ts[obj->tail++] = timestamp;
}

int hitCounterGetHits(HitCounter* obj, int timestamp) {
    // The window is (timestamp - 300, timestamp]: anything at or before timestamp - 300 is out.
    while (obj->head < obj->tail && obj->ts[obj->head] <= timestamp - 300) obj->head++;
    return obj->tail - obj->head;
}

void hitCounterFree(HitCounter* obj) {
    free(obj->ts);
    free(obj);
}
