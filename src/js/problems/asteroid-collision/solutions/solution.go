// O(n) time - a stack of survivors; every asteroid is pushed and popped at most once.
func asteroidCollision(asteroids []int) []int {
	// A slice used as a stack is already the answer in left to right order.
	stack := make([]int, 0, len(asteroids))
	for _, a := range asteroids {
		alive := true
		// Only a left-mover arriving at a right-mover on top of the stack can collide.
		for alive && a < 0 && len(stack) > 0 && stack[len(stack)-1] > 0 {
			top := stack[len(stack)-1]
			if top < -a {
				stack = stack[:len(stack)-1] // the left-mover wins and keeps going
			} else {
				if top == -a {
					stack = stack[:len(stack)-1] // equal sizes: both go
				}
				alive = false
			}
		}
		if alive {
			stack = append(stack, a)
		}
	}
	return stack
}
