// O(n) time - pref[i] ^ pref[i - 1] cancels every element before i and leaves arr[i].
func undoRunningXor(pref []int) []int {
	arr := make([]int, len(pref))
	arr[0] = pref[0]
	for i := 1; i < len(pref); i++ {
		arr[i] = pref[i] ^ pref[i-1]
	}
	return arr
}
