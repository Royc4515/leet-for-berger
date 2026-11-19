// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0336.Palindrome%20Pairs/Solution.go
import "sort"

// O(n * k^2): split every word w = a + b at every position. If b is a palindrome, the partner on
// the right must be exactly reverse(a); if a is a palindrome, the partner on the left must be
// exactly reverse(b). A map from word to index finds either in O(k).
func palindromeJoins(words []string) [][]int {
	d := map[string]int{}
	for i, w := range words {
		d[w] = i
	}
	ans := [][]int{}
	for i, w := range words {
		for j := 0; j <= len(w); j++ {
			a, b := w[:j], w[j:]
			ra, rb := reverseWord(a), reverseWord(b)
			if k, ok := d[ra]; ok && k != i && b == rb {
				ans = append(ans, []int{i, k})
			}
			// j > 0: an empty a would find the same equal-length mirror pair a second time.
			if j > 0 {
				if k, ok := d[rb]; ok && k != i && a == ra {
					ans = append(ans, []int{k, i})
				}
			}
		}
	}
	sort.Slice(ans, func(x, y int) bool {
		if ans[x][0] != ans[y][0] {
			return ans[x][0] < ans[y][0]
		}
		return ans[x][1] < ans[y][1]
	})
	return ans
}

func reverseWord(s string) string {
	b := []byte(s)
	for i, j := 0, len(b)-1; i < j; i, j = i+1, j-1 {
		b[i], b[j] = b[j], b[i]
	}
	return string(b)
}
