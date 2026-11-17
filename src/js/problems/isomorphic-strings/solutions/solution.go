// O(n) time - ASCII fits in arrays; one table per direction catches each kind of collision.
func isIsomorphic(s string, t string) bool {
	if len(s) != len(t) {
		return false
	}
	var fwd, back [128]int
	for i := 0; i < len(s); i++ {
		// Store char + 1 so that 0 can mean "not mapped yet".
		a, b := int(s[i]), int(t[i])
		if fwd[a] == 0 && back[b] == 0 {
			fwd[a], back[b] = b+1, a+1
		} else if fwd[a] != b+1 || back[b] != a+1 {
			return false
		}
	}
	return true
}
