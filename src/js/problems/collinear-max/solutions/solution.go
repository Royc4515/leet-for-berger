// O(n^2) time - for each anchor, count the other points per exact direction.
func maxPoints(points [][]int) int {
	n := len(points)
	if n <= 2 {
		return n
	}
	gcd := func(a, b int) int {
		for b != 0 {
			a, b = b, a%b
		}
		return a
	}
	abs := func(v int) int {
		if v < 0 {
			return -v
		}
		return v
	}
	best := 1
	for i := 0; i < n; i++ {
		directions := map[int]int{}
		for j := i + 1; j < n; j++ {
			dx := points[j][0] - points[i][0]
			dy := points[j][1] - points[i][1]
			g := gcd(abs(dx), abs(dy))
			dx /= g
			dy /= g
			// One canonical sign per line: (1, -1) and (-1, 1) are the same direction.
			if dx < 0 || (dx == 0 && dy < 0) {
				dx, dy = -dx, -dy
			}
			key := dx*40001 + dy
			directions[key]++
			if directions[key]+1 > best {
				best = directions[key] + 1
			}
		}
	}
	return best
}
