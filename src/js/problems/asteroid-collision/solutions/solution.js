/**
 * O(n) time - a stack of survivors; every asteroid is pushed and popped at most once.
 * @param {number[]} asteroids
 * @return {number[]}
 */
function asteroidCollision(asteroids) {
  const stack = [];
  for (const a of asteroids) {
    let alive = true;
    // Only a left-mover arriving at a right-mover on top of the stack can collide.
    while (alive && a < 0 && stack.length > 0 && stack[stack.length - 1] > 0) {
      const top = stack[stack.length - 1];
      if (top < -a) {
        stack.pop(); // the left-mover wins and keeps going
      } else {
        if (top === -a) stack.pop(); // equal sizes: both go
        alive = false;
      }
    }
    if (alive) stack.push(a);
  }
  return stack;
}
