// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0349.Intersection%20of%20Two%20Arrays/Solution.go
import "sort"

// O(n + m + k log k) time: set lookups replace the O(n * m) nested loop.
func commonValues(nums1 []int, nums2 []int) []int {
	inFirst := make(map[int]bool, len(nums1))
	for _, x := range nums1 {
		inFirst[x] = true
	}
	ans := []int{}
	for _, x := range nums2 {
		if inFirst[x] {
			ans = append(ans, x)
			// Clearing a match means a repeat in nums2 cannot report it again.
			delete(inFirst, x)
		}
	}
	sort.Ints(ans)
	return ans
}
