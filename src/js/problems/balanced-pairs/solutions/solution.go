// O(C * n) time for C answers: every path of the search is a valid prefix, so nothing is wasted.
func balancedPairs(n int, maxDepth int) []string {
	out := []string{}
	path := make([]byte, 0, 2*n)
	var dfs func(opened, closed int)
	dfs = func(opened, closed int) {
		if len(path) == 2*n {
			out = append(out, string(path))
			return
		}
		// Open while pairs remain and the depth (opened - closed) is under the limit.
		// "(" is tried first because it sorts before ")", which keeps the output in order.
		if opened < n && opened-closed < maxDepth {
			path = append(path, '(')
			dfs(opened+1, closed)
			path = path[:len(path)-1]
		}
		// Close only while something is open.
		if closed < opened {
			path = append(path, ')')
			dfs(opened, closed+1)
			path = path[:len(path)-1]
		}
	}
	dfs(0, 0)
	return out
}
