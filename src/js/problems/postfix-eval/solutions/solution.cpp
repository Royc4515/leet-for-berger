class Solution {
public:
    // O(n) time - operands wait on a stack; each operator combines the two most recent values.
    int evalPostfix(vector<string>& tokens) {
        vector<int> stack;
        stack.reserve(tokens.size());
        for (const string& t : tokens) {
            // Compare whole tokens, not t[0]: "-3" is a number, not a minus sign.
            if (t.size() == 1 && string("+-*/").find(t[0]) != string::npos) {
                int b = stack.back(); // the right operand was pushed last
                stack.pop_back();
                int a = stack.back();
                stack.pop_back();
                switch (t[0]) {
                    case '+': stack.push_back(a + b); break;
                    case '-': stack.push_back(a - b); break;
                    case '*': stack.push_back(a * b); break;
                    default: stack.push_back(a / b); // C++ int division truncates toward zero
                }
            } else {
                stack.push_back(stoi(t));
            }
        }
        return stack[0];
    }
};
