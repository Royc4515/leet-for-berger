const side = 1001

// O(1) per add; per count, O(distinct points in the query's column). A corner on the query's
// vertical line fixes the side length d, and the square lies either to the left or to the right,
// so each such corner is checked twice.
type SquareCounter struct {
	// Multiplicity of every grid point, flattened: point (x, y) lives at x * side + y.
	cnt []int
	// Distinct y values seen in each column, so Count walks only the column it needs.
	cols [][]int
}

func Constructor() SquareCounter {
	return SquareCounter{make([]int, side*side), make([][]int, side)}
}

func (this *SquareCounter) Add(point []int) {
	x, y := point[0], point[1]
	k := x*side + y
	if this.cnt[k] == 0 {
		this.cols[x] = append(this.cols[x], y)
	}
	this.cnt[k]++
}

func (this *SquareCounter) Count(point []int) int64 {
	x, y := point[0], point[1]
	var total int64
	for _, y2 := range this.cols[x] {
		d := y2 - y
		if d == 0 {
			continue
		}
		// int64 before multiplying: three multiplicities multiply to about 4 * 10^12.
		here := int64(this.cnt[x*side+y2])
		for _, x2 := range [2]int{x - d, x + d} {
			if x2 < 0 || x2 >= side {
				continue
			}
			// Copies are distinct choices, so the multiplicities multiply.
			total += here * int64(this.cnt[x2*side+y]) * int64(this.cnt[x2*side+y2])
		}
	}
	return total
}
