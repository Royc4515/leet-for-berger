class Solution {
public:
    // O(n) time, O(n) space: a stack holds the directory names of the path read so far.
    string tidyPath(string path) {
        vector<string> stack;
        size_t i = 0;
        while (i < path.size()) {
            size_t j = path.find('/', i);
            if (j == string::npos) {
                j = path.size();
            }
            string part = path.substr(i, j - i);
            i = j + 1;
            // Empty pieces come from repeated slashes and "." stays where it is.
            if (part.empty() || part == ".") {
                continue;
            }
            if (part == "..") {
                // At the root there is nothing to go up to, so ".." is ignored.
                if (!stack.empty()) {
                    stack.pop_back();
                }
            } else {
                // Only the exact pieces "." and ".." are special: "..." is an ordinary name.
                stack.push_back(part);
            }
        }
        string result;
        for (const string& name : stack) {
            result += "/" + name;
        }
        return result.empty() ? "/" : result;
    }
};
