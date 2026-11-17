class Solution {
public:
    // O(n) time - a stack of survivors; every asteroid is pushed and popped at most once.
    vector<int> asteroidCollision(vector<int>& asteroids) {
        // A vector used as a stack is already the answer in left to right order.
        vector<int> stack;
        for (int a : asteroids) {
            bool alive = true;
            // Only a left-mover arriving at a right-mover on top of the stack can collide.
            while (alive && a < 0 && !stack.empty() && stack.back() > 0) {
                int top = stack.back();
                if (top < -a) {
                    stack.pop_back(); // the left-mover wins and keeps going
                } else {
                    if (top == -a) stack.pop_back(); // equal sizes: both go
                    alive = false;
                }
            }
            if (alive) stack.push_back(a);
        }
        return stack;
    }
};
