import "strconv"

// O(n) time - two independent checks build the label, so a multiple of both gets both words.
func fizzBuzzList(n int) []string {
	out := make([]string, 0, n)
	for i := 1; i <= n; i++ {
		label := ""
		if i%3 == 0 {
			label += "Fizz"
		}
		if i%5 == 0 {
			label += "Buzz"
		}
		if label == "" {
			label = strconv.Itoa(i)
		}
		out = append(out, label)
	}
	return out
}
