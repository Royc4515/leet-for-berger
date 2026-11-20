import "strings"

// O(n) time, O(n) space: a stack holds the directory names of the path read so far.
func tidyPath(path string) string {
	var stack []string
	for _, part := range strings.Split(path, "/") {
		// Empty pieces come from repeated slashes and "." stays where it is.
		if part == "" || part == "." {
			continue
		}
		if part == ".." {
			// At the root there is nothing to go up to, so ".." is ignored.
			if len(stack) > 0 {
				stack = stack[:len(stack)-1]
			}
		} else {
			// Only the exact pieces "." and ".." are special: "..." is an ordinary name.
			stack = append(stack, part)
		}
	}
	return "/" + strings.Join(stack, "/")
}
