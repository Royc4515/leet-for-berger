// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/1100-1199/1169.Invalid%20Transactions/Solution.cpp
// O(n^2) time, O(n) space: C has no hash map, and at n <= 1000 comparing every pair is cheap.
typedef struct { char name[16]; int minute; int amount; char city[16]; } Payment;

char** suspiciousPayments(char** payments, int paymentsSize, int* returnSize) {
    Payment* rows = malloc(sizeof(Payment) * (paymentsSize ? paymentsSize : 1));
    bool* flagged = calloc(paymentsSize ? paymentsSize : 1, sizeof(bool));
    for (int i = 0; i < paymentsSize; i++) {
        // Names and cities are at most 10 lowercase letters, so the %15 fields cannot overflow.
        sscanf(payments[i], "%15[^,],%d,%d,%15s", rows[i].name, &rows[i].minute, &rows[i].amount, rows[i].city);
        if (rows[i].amount > 1000) flagged[i] = true;
        for (int j = 0; j < i; j++) {
            if (strcmp(rows[i].name, rows[j].name) == 0 && strcmp(rows[i].city, rows[j].city) != 0 &&
                abs(rows[i].minute - rows[j].minute) <= 60) {
                // A conflict makes both records suspicious, including the one seen earlier.
                flagged[i] = flagged[j] = true;
            }
        }
    }
    // Flags live on positions, so identical copies stay separate and input order is kept.
    char** out = malloc(sizeof(char*) * (paymentsSize ? paymentsSize : 1));
    int n = 0;
    for (int i = 0; i < paymentsSize; i++) {
        if (!flagged[i]) continue;
        out[n] = malloc(strlen(payments[i]) + 1);
        strcpy(out[n++], payments[i]);
    }
    free(rows);
    free(flagged);
    *returnSize = n;
    return out;
}
