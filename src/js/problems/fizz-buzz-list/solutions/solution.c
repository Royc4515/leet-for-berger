// O(n) time - the multiple-of-both test comes first, so 15 is never caught by the 3 or 5 branch.
char** fizzBuzzList(int n, int* returnSize) {
    char** out = malloc(sizeof(char*) * n);
    for (int i = 1; i <= n; i++) {
        // 9 bytes hold "FizzBuzz" and its terminator; a number up to 10^5 needs at most 7.
        char* label = malloc(9);
        if (i % 15 == 0) strcpy(label, "FizzBuzz");
        else if (i % 3 == 0) strcpy(label, "Fizz");
        else if (i % 5 == 0) strcpy(label, "Buzz");
        else sprintf(label, "%d", i);
        out[i - 1] = label;
    }
    *returnSize = n;
    return out;
}
