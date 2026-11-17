// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0187.Repeated%20DNA%20Sequences/Solution.go
import "sort"

// O(n) windows (each slice is 10 bytes), then a sort of the repeated ones.
func repeatedWindows(s string) []string {
	cnt := map[string]int{}
	ans := []string{}
	for i := 0; i+10 <= len(s); i++ {
		t := s[i : i+10]
		cnt[t]++
		// Report on the second sighting only, so a window seen three times is listed once.
		if cnt[t] == 2 {
			ans = append(ans, t)
		}
	}
	sort.Strings(ans)
	return ans
}
