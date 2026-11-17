// O(1) amortized per operation: parallel arrays of values and running minimums.
typedef struct {
    int* vals;
    int* mins;
    int size;
    int cap;
} MinStack;

MinStack* minStackCreate() {
    MinStack* obj = malloc(sizeof(MinStack));
    obj->cap = 16;
    obj->size = 0;
    obj->vals = malloc(sizeof(int) * obj->cap);
    obj->mins = malloc(sizeof(int) * obj->cap);
    return obj;
}

void minStackPush(MinStack* obj, int val) {
    if (obj->size == obj->cap) {
        obj->cap *= 2;
        obj->vals = realloc(obj->vals, sizeof(int) * obj->cap);
        obj->mins = realloc(obj->mins, sizeof(int) * obj->cap);
    }
    // The minimum below an entry never changes while that entry sits on the stack.
    int below = obj->size ? obj->mins[obj->size - 1] : val;
    obj->vals[obj->size] = val;
    obj->mins[obj->size] = val < below ? val : below;
    obj->size++;
}

void minStackPop(MinStack* obj) {
    obj->size--;
}

int minStackTop(MinStack* obj) {
    return obj->vals[obj->size - 1];
}

int minStackGetMin(MinStack* obj) {
    return obj->mins[obj->size - 1];
}

void minStackFree(MinStack* obj) {
    free(obj->vals);
    free(obj->mins);
    free(obj);
}
