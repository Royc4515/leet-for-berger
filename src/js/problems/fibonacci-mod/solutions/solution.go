// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0500-0599/0509.Fibonacci%20Number/Solution.go
// O(n) time, O(1) space - only the last two values are needed. A loop instead of recursion:
// the plain recursion is exponential and a memoized one is 10^6 frames deep.
func fibonacciMod(n int) int {
	const mod = 1000000007
	a, b := 0, 1
	for i := 0; i < n; i++ {
		// Go's int is 64-bit here, so the sum of two residues cannot overflow.
		a, b = b, (a+b)%mod
	}
	return a
}
