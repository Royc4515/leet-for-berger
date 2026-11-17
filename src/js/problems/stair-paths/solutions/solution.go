// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0070.Climbing%20Stairs/Solution.go
// O(n) time, O(1) space - the last move is 1 or 2 steps, so ways(n) = ways(n - 1) + ways(n - 2).
func climbStairs(n int) int {
	const mod = 1_000_000_007
	a, b := 0, 1
	for i := 0; i < n; i++ {
		// Go's int is 64-bit here, but reducing every step keeps it correct on 32-bit targets too.
		a, b = b, (a+b)%mod
	}
	return b
}
