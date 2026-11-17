import "strconv"

// O(n) time - operands wait on a stack; each operator combines the two most recent values.
func evalPostfix(tokens []string) int {
	stack := make([]int, 0, len(tokens))
	for _, t := range tokens {
		// Compare whole tokens, not t[0]: "-3" is a number, not a minus sign.
		switch t {
		case "+", "-", "*", "/":
			b := stack[len(stack)-1] // the right operand was pushed last
			a := stack[len(stack)-2]
			stack = stack[:len(stack)-2]
			var r int
			switch t {
			case "+":
				r = a + b
			case "-":
				r = a - b
			case "*":
				r = a * b
			default:
				r = a / b // Go integer division truncates toward zero
			}
			stack = append(stack, r)
		default:
			v, _ := strconv.Atoi(t)
			stack = append(stack, v)
		}
	}
	return stack[0]
}
