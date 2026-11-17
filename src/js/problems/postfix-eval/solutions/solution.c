// O(n) time - operands wait on a stack; each operator combines the two most recent values.
int evalPostfix(char** tokens, int tokensSize) {
    int* stack = malloc(sizeof(int) * (tokensSize ? tokensSize : 1));
    int top = 0;
    for (int i = 0; i < tokensSize; i++) {
        const char* t = tokens[i];
        // A one-character check: "-3" has a second character, so it is a number, not a minus.
        if (t[1] == '\0' && (t[0] == '+' || t[0] == '-' || t[0] == '*' || t[0] == '/')) {
            int b = stack[--top]; // the right operand was pushed last
            int a = stack[--top];
            switch (t[0]) {
                case '+': stack[top++] = a + b; break;
                case '-': stack[top++] = a - b; break;
                case '*': stack[top++] = a * b; break;
                default: stack[top++] = a / b; // C int division truncates toward zero (C99 on)
            }
        } else {
            stack[top++] = atoi(t);
        }
    }
    int result = stack[0];
    free(stack);
    return result;
}
