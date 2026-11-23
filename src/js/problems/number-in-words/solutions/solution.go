// O(1) time and space: split into at most four base-1000 groups and spell each non-zero chunk.
func numberToWords(num int) string {
	if num == 0 {
		return "Zero"
	}
	below20 := []string{
		"", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
		"Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
		"Seventeen", "Eighteen", "Nineteen",
	}
	tens := []string{"", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"}
	scales := []string{"", "Thousand", "Million", "Billion"}

	var chunks [4]int
	count := 0
	for num > 0 {
		chunks[count] = num % 1000
		num /= 1000
		count++
	}

	out := make([]byte, 0, 160)
	addWord := func(w string) {
		if len(out) > 0 {
			out = append(out, ' ')
		}
		out = append(out, w...)
	}

	for i := count - 1; i >= 0; i-- {
		n := chunks[i]
		if n == 0 {
			continue
		}
		if n >= 100 {
			addWord(below20[n/100])
			addWord("Hundred")
			n %= 100
		}
		if n >= 20 {
			addWord(tens[n/10])
			n %= 10
		}
		if n > 0 {
			addWord(below20[n])
		}
		if scales[i] != "" {
			addWord(scales[i])
		}
	}
	return string(out)
}
