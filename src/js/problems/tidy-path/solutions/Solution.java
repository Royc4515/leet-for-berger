import java.util.ArrayList;
import java.util.List;

class Solution {
    // O(n) time, O(n) space: a stack holds the directory names of the path read so far.
    public String tidyPath(String path) {
        List<String> stack = new ArrayList<>();
        for (String part : path.split("/")) {
            // Empty pieces come from repeated slashes and "." stays where it is.
            if (part.isEmpty() || part.equals(".")) {
                continue;
            }
            if (part.equals("..")) {
                // At the root there is nothing to go up to, so ".." is ignored.
                if (!stack.isEmpty()) {
                    stack.remove(stack.size() - 1);
                }
            } else {
                // Only the exact pieces "." and ".." are special: "..." is an ordinary name.
                stack.add(part);
            }
        }
        return "/" + String.join("/", stack);
    }
}
