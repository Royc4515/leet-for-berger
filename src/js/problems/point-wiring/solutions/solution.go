// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/1500-1599/1584.Min%20Cost%20to%20Connect%20All%20Points/Solution.go

// O(n^2) - Prim's algorithm on the complete graph without building it: dist[k] is the cheapest
// wire from outside point k into the tree, computed on the fly.
func minCostConnectPoints(points [][]int) (ans int) {
	n := len(points)
	vis := make([]bool, n)
	dist := make([]int, n)
	for i := range dist {
		dist[i] = 1 << 62
	}
	dist[0] = 0
	for i := 0; i < n; i++ {
		j := -1
		for k := 0; k < n; k++ {
			if !vis[k] && (j == -1 || dist[k] < dist[j]) {
				j = k
			}
		}
		vis[j] = true
		ans += dist[j]
		x, y := points[j][0], points[j][1]
		for k := 0; k < n; k++ {
			if !vis[k] {
				dist[k] = min(dist[k], abs(points[k][0]-x)+abs(points[k][1]-y))
			}
		}
	}
	return
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}
