import "sort"

// O(n^2) time - sort, fix the smallest value, then two pointers on the rest.
func threeSum(nums []int) [][]int {
	a := append([]int(nil), nums...)
	sort.Ints(a)
	out := [][]int{}
	for i := 0; i < len(a)-2; i++ {
		// Sorted: once the smallest value is positive, no triplet can reach zero.
		if a[i] > 0 {
			break
		}
		// Equal neighbours would produce the same triplets again.
		if i > 0 && a[i] == a[i-1] {
			continue
		}
		lo, hi := i+1, len(a)-1
		for lo < hi {
			sum := a[i] + a[lo] + a[hi]
			switch {
			case sum < 0:
				lo++
			case sum > 0:
				hi--
			default:
				out = append(out, []int{a[i], a[lo], a[hi]})
				lo++
				hi--
				// Step past repeats of the pair just used, so it is reported once.
				for lo < hi && a[lo] == a[lo-1] {
					lo++
				}
				for lo < hi && a[hi] == a[hi+1] {
					hi--
				}
			}
		}
	}
	return out
}
