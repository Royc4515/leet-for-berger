public class Solution {
    // O(n) time, O(n) space: a stack holds the directory names of the path read so far.
    public string TidyPath(string path) {
        var stack = new List<string>();
        foreach (string part in path.Split('/')) {
            // Empty pieces come from repeated slashes and "." stays where it is.
            if (part.Length == 0 || part == ".") {
                continue;
            }
            if (part == "..") {
                // At the root there is nothing to go up to, so ".." is ignored.
                if (stack.Count > 0) {
                    stack.RemoveAt(stack.Count - 1);
                }
            } else {
                // Only the exact pieces "." and ".." are special: "..." is an ordinary name.
                stack.Add(part);
            }
        }
        return "/" + string.Join("/", stack);
    }
}
