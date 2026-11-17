static int symbolValue(char c) {
    switch (c) {
        case 'I': return 1;
        case 'V': return 5;
        case 'X': return 10;
        case 'L': return 50;
        case 'C': return 100;
        case 'D': return 500;
        default: return 1000;
    }
}

// O(n) time - each symbol only needs its right neighbour to know its sign.
int romanToInt(char* s) {
    int total = 0;
    for (int i = 0; s[i]; i++) {
        int v = symbolValue(s[i]);
        // A smaller symbol before a larger one is the left half of a subtractive pair (IV, CM).
        // s[i + 1] is the terminator at the end, which never compares as larger.
        if (s[i + 1] && v < symbolValue(s[i + 1])) total -= v;
        else total += v;
    }
    return total;
}
