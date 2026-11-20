// O(1): always 32 rounds, so leading zeros of n become trailing zeros of the answer.
func mirrorBits(n int64) int64 {
	// int64 holds all 32 bits as a positive number; an int32 answer would go negative.
	var out int64
	for i := 0; i < 32; i++ {
		out = (out << 1) | (n & 1)
		n >>= 1
	}
	return out
}
