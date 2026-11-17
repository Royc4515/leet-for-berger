// O(m * n) time - long multiplication, digit by digit. The result is malloc'ed; the caller frees it.
char* multiply(char* num1, char* num2) {
    int m = strlen(num1), n = strlen(num2);
    if (strcmp(num1, "0") == 0 || strcmp(num2, "0") == 0) {
        char* zero = malloc(2);
        strcpy(zero, "0");
        return zero;
    }
    // Digit i of num1 times digit j of num2 contributes to position i + j + 1 (0 = most significant).
    int* pos = calloc(m + n, sizeof(int));
    for (int i = m - 1; i >= 0; i--) {
        int da = num1[i] - '0';
        int carry = 0;
        for (int j = n - 1; j >= 0; j--) {
            int total = pos[i + j + 1] + da * (num2[j] - '0') + carry;
            pos[i + j + 1] = total % 10;
            carry = total / 10;
        }
        // Everything right of position i has been settled; the leftover carry lands at i.
        pos[i] += carry;
    }
    // The product has m + n or m + n - 1 digits; only the first one can be a zero.
    int start = pos[0] == 0 ? 1 : 0;
    char* out = malloc(m + n - start + 1);
    int len = 0;
    for (int k = start; k < m + n; k++) out[len++] = (char)('0' + pos[k]);
    out[len] = '\0';
    free(pos);
    return out;
}
