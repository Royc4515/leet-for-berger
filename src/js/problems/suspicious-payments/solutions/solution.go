// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/1100-1199/1169.Invalid%20Transactions/Solution.go
import (
	"strconv"
	"strings"
)

type paymentItem struct {
	minute int
	city   string
	index  int
}

// O(n + sum of g^2) time for name groups of size g, O(n) space.
func suspiciousPayments(payments []string) []string {
	byName := map[string][]paymentItem{}
	flagged := make([]bool, len(payments))
	for i, p := range payments {
		e := strings.Split(p, ",")
		minute, _ := strconv.Atoi(e[1])
		amount, _ := strconv.Atoi(e[2])
		city := e[3]
		if amount > 1000 {
			flagged[i] = true
		}
		for _, item := range byName[e[0]] {
			if item.city != city && absInt(minute-item.minute) <= 60 {
				// A conflict makes both records suspicious, including the one seen earlier.
				flagged[i], flagged[item.index] = true, true
			}
		}
		byName[e[0]] = append(byName[e[0]], paymentItem{minute, city, i})
	}
	// Flags live on positions, so identical copies stay separate and input order is kept.
	out := []string{}
	for i, p := range payments {
		if flagged[i] {
			out = append(out, p)
		}
	}
	return out
}

func absInt(x int) int {
	if x < 0 {
		return -x
	}
	return x
}
