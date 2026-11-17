// O(n) time - a subarray (i, j] sums to k exactly when prefix[j] - prefix[i] == k.
func subarraySum(nums []int, k int) int64 {
	// Seeding prefix 0 once counts subarrays that start at index 0.
	seen := make(map[int]int, len(nums)+1)
	seen[0] = 1
	prefix := 0
	var count int64 // up to n(n+1)/2, about 5 * 10^9: keep it 64-bit explicitly
	for _, v := range nums {
		prefix += v
		// Look up before inserting, so the empty subarray (i == j) is never counted.
		count += int64(seen[prefix-k])
		seen[prefix]++
	}
	return count
}
