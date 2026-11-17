def asteroid_collision(asteroids: list[int]) -> list[int]:
    # O(n) time - a stack of survivors; every asteroid is pushed and popped at most once.
    stack = []
    for a in asteroids:
        alive = True
        # Only a left-mover arriving at a right-mover on top of the stack can collide.
        while alive and a < 0 and stack and stack[-1] > 0:
            top = stack[-1]
            if top < -a:
                stack.pop()  # the left-mover wins and keeps going
            else:
                if top == -a:
                    stack.pop()  # equal sizes: both go
                alive = False
        if alive:
            stack.append(a)
    return stack
