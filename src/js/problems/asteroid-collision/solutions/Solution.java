import java.util.*;

class Solution {
    // O(n) time - a stack of survivors; every asteroid is pushed and popped at most once.
    public int[] asteroidCollision(int[] asteroids) {
        // An int array with a top index is a stack without boxing, and the result is its prefix.
        int[] stack = new int[asteroids.length];
        int top = 0;
        for (int a : asteroids) {
            boolean alive = true;
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
        return Arrays.copyOf(stack, top);
    }
}
