// O(a + b) time - both lists are sorted by index, so a merge finds the shared indices.
func sparseDot(a [][]int, b [][]int) int {
	i, j, dot := 0, 0, 0
	for i < len(a) && j < len(b) {
		if a[i][0] == b[j][0] {
			dot += a[i][1] * b[j][1]
			i++
			j++
		} else if a[i][0] < b[j][0] {
			// The smaller index can never meet a partner: every later index in the other list is larger.
			i++
		} else {
			j++
		}
	}
	return dot
}
