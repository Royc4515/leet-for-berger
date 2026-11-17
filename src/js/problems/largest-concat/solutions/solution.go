import (
	"sort"
	"strconv"
	"strings"
)

// O(n log n) comparisons - a goes before b exactly when a + b beats b + a as a string.
func largestNumber(nums []int) string {
	parts := make([]string, len(nums))
	for i, v := range nums {
		parts[i] = strconv.Itoa(v)
	}
	// a + b and b + a have the same length, so string order is numeric order.
	sort.Slice(parts, func(i, j int) bool { return parts[i]+parts[j] > parts[j]+parts[i] })
	// The largest value leads; if it is 0, every value is 0 and the answer is a single "0".
	if parts[0] == "0" {
		return "0"
	}
	return strings.Join(parts, "")
}
