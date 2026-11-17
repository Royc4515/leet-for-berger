// O(32) - XOR adds without carrying, AND << 1 is the carry; repeat until no carry is left.
func getSum(a int, b int) int {
	// Go's int is 64-bit, so the carry would not fall off at bit 32; uint32 wraps at 2^32 and
	// converting back through int32 restores the sign.
	x, y := uint32(a), uint32(b)
	for y != 0 {
		carry := (x & y) << 1
		x ^= y
		y = carry
	}
	return int(int32(x))
}
