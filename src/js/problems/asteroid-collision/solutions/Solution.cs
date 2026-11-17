public class Solution {
    // O(n) time - a stack of survivors; every asteroid is pushed and popped at most once.
    public int[] AsteroidCollision(int[] asteroids) {
        // A List used as a stack keeps survivors in left to right order, unlike Stack<int>.
        var stack = new List<int>();
        foreach (int a in asteroids) {
            bool alive = true;
            // Only a left-mover arriving at a right-mover on top of the stack can collide.
            while (alive && a < 0 && stack.Count > 0 && stack[^1] > 0) {
                int top = stack[^1];
                if (top < -a) {
                    stack.RemoveAt(stack.Count - 1); // the left-mover wins and keeps going
                } else {
                    if (top == -a) stack.RemoveAt(stack.Count - 1); // equal sizes: both go
                    alive = false;
                }
            }
            if (alive) stack.Add(a);
        }
        return stack.ToArray();
    }
}
