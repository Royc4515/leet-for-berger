// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0500-0599/0518.Coin%20Change%20II/Solution.go
// O(amount * coins) time, O(amount) space. The coin loop is outside, so every combination is
// built in one fixed coin order and counted once.
func change(amount int, coins []int) int {
	const mod = 1_000_000_007
	ways := make([]int, amount+1)
	ways[0] = 1
	for _, c := range coins {
		for a := c; a <= amount; a++ {
			ways[a] = (ways[a] + ways[a-c]) % mod
		}
	}
	return ways[amount]
}
