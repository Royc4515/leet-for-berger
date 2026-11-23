import (
	"math"
	"sort"
)

// O(n log n) time - only directions matter: sort the polar angles and slide a window of the
// view's width over them, with every angle repeated + 2 * pi so a view facing west wraps.
func visiblePoints(points [][]int, angle int, location []int) int {
	x, y := location[0], location[1]
	here := 0
	angles := make([]float64, 0, 2*len(points))
	for _, p := range points {
		// A point on the viewer has no direction and is visible whichever way you face.
		if p[0] == x && p[1] == y {
			here++
		} else {
			angles = append(angles, math.Atan2(float64(p[1]-y), float64(p[0]-x)))
		}
	}
	sort.Float64s(angles)
	m := len(angles)
	for i := 0; i < m; i++ {
		angles = append(angles, angles[i]+2*math.Pi)
	}
	// 1e-9 keeps a point exactly on the edge inside even if atan2 rounds it a hair outside.
	width := float64(angle)*math.Pi/180 + 1e-9
	best := 0
	for i, j := 0, 0; j < 2*m; j++ {
		for angles[j]-angles[i] > width {
			i++
		}
		if j-i+1 > best {
			best = j - i + 1
		}
	}
	// A window never holds the same direction twice.
	return min(best, m) + here
}
