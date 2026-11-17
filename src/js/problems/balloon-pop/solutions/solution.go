// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0312.Burst%20Balloons/Solution.go
// O(n^3) time, O(n^2) space. f[i][j] is the best total for popping everything strictly between
// borders i and j; the balloon popped last has the borders as neighbors, so the sides split.
func maxCoins(nums []int) int {
	n := len(nums)
	arr := make([]int, n+2)
	arr[0], arr[n+1] = 1, 1
	copy(arr[1:], nums)
	f := make([][]int, n+2)
	for i := range f {
		f[i] = make([]int, n+2)
	}
	for i := n - 1; i >= 0; i-- {
		for j := i + 2; j <= n+1; j++ {
			for k := i + 1; k < j; k++ {
				f[i][j] = max(f[i][j], f[i][k]+f[k][j]+arr[i]*arr[k]*arr[j])
			}
		}
	}
	return f[0][n+1]
}
