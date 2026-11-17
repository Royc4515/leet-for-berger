// O(m * n) time - long multiplication, digit by digit; no math/big.
func multiply(num1 string, num2 string) string {
	if num1 == "0" || num2 == "0" {
		return "0"
	}
	m, n := len(num1), len(num2)
	// Digit i of num1 times digit j of num2 contributes to position i + j + 1 (0 = most significant).
	pos := make([]int, m+n)
	for i := m - 1; i >= 0; i-- {
		da := int(num1[i] - '0')
		carry := 0
		for j := n - 1; j >= 0; j-- {
			total := pos[i+j+1] + da*int(num2[j]-'0') + carry
			pos[i+j+1] = total % 10
			carry = total / 10
		}
		// Everything right of position i has been settled; the leftover carry lands at i.
		pos[i] += carry
	}
	// The product has m + n or m + n - 1 digits; only the first one can be a zero.
	start := 0
	if pos[0] == 0 {
		start = 1
	}
	out := make([]byte, 0, m+n-start)
	for _, d := range pos[start:] {
		out = append(out, byte('0'+d))
	}
	return string(out)
}
