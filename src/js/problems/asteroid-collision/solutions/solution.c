// O(n) time - a stack of survivors; every asteroid is pushed and popped at most once.
int* asteroidCollision(int* asteroids, int asteroidsSize, int* returnSize) {
    // The stack can never hold more than the input, and it is already the answer in order.
    int* stack = malloc(sizeof(int) * (asteroidsSize ? asteroidsSize : 1));
    int top = 0;
    for (int i = 0; i < asteroidsSize; i++) {
        int a = asteroids[i];
        bool alive = true;
        // Only a left-mover arriving at a right-mover on top of the stack can collide.
        while (alive && a < 0 && top > 0 && stack[top - 1] > 0) {
            int last = stack[top - 1];
            if (last < -a) {
                top--; // the left-mover wins and keeps going
            } else {
                if (last == -a) top--; // equal sizes: both go
                alive = false;
            }
        }
        if (alive) stack[top++] = a;
    }
    *returnSize = top;
    return stack;
}
