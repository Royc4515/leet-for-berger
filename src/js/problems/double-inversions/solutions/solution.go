// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0400-0499/0493.Reverse%20Pairs/Solution.go

// O(n log n) - merge sort. Before merging two sorted halves, one forward sweep counts, for each
// right-half value, the left-half values above twice it. Go's int is 64-bit, so neither
// 2 * nums[j] nor the count (up to about 5 * 10^9) overflows.
func reversePairs(input []int) int64 {
	// A copy: sorting must not change the caller's slice.
	nums := append([]int(nil), input...)
	n := len(nums)
	t := make([]int, n)
	var mergeSort func(l, r int) int
	mergeSort = func(l, r int) int {
		if l >= r {
			return 0
		}
		mid := (l + r) >> 1
		ans := mergeSort(l, mid) + mergeSort(mid+1, r)
		i, j, k := l, mid+1, 0
		for i <= mid && j <= r {
			if nums[i] <= nums[j]*2 {
				i++
			} else {
				ans += mid - i + 1
				j++
			}
		}
		i, j = l, mid+1
		for i <= mid && j <= r {
			if nums[i] <= nums[j] {
				t[k] = nums[i]
				k, i = k+1, i+1
			} else {
				t[k] = nums[j]
				k, j = k+1, j+1
			}
		}
		for ; i <= mid; i, k = i+1, k+1 {
			t[k] = nums[i]
		}
		for ; j <= r; j, k = j+1, k+1 {
			t[k] = nums[j]
		}
		for i = l; i <= r; i++ {
			nums[i] = t[i-l]
		}
		return ans
	}
	return int64(mergeSort(0, n-1))
}
