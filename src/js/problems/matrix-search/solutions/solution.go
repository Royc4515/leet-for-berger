// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0074.Search%20a%202D%20Matrix/Solution.go
// O(log(m * n)) time - the rows read in order form one sorted list; index i is cell (i / n, i % n).
func searchMatrix(matrix [][]int, target int) bool {
	m, n := len(matrix), len(matrix[0])
	// Find the first position whose value is >= target, then check whether it is the target.
	left, right := 0, m*n-1
	for left < right {
		mid := (left + right) >> 1
		x, y := mid/n, mid%n
		if matrix[x][y] >= target {
			right = mid
		} else {
			left = mid + 1
		}
	}
	return matrix[left/n][left%n] == target
}
