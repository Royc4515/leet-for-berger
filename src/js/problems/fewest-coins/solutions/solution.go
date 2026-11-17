// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0322.Coin%20Change/Solution.go
// O(amount * len(coins)) time - the best way to pay a ends with some coin c, after paying a - c.
func coinChange(coins []int, amount int) int {
	// amount + 1 coins is impossible (every coin is at least 1), so it doubles as "unreachable".
	inf := amount + 1
	f := make([]int, amount+1)
	for j := 1; j <= amount; j++ {
		f[j] = inf
	}
	// Coins in the outer loop: each pass allows one more denomination, reused any number of times.
	for _, x := range coins {
		for j := x; j <= amount; j++ {
			f[j] = min(f[j], f[j-x]+1)
		}
	}
	if f[amount] >= inf {
		return -1
	}
	return f[amount]
}
