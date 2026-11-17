// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0055.Jump%20Game/Solution.go
// O(n) time - reachable indices always form a prefix, so its right end says everything.
func canJump(nums []int) bool {
	reach := 0
	for i, x := range nums {
		// Standing past the farthest reachable index means no path ever got here.
		if reach < i {
			return false
		}
		reach = max(reach, i+x)
	}
	return true
}
