// O(n) time - pref[i] ^ pref[i - 1] cancels every element before i and leaves arr[i].
int* undoRunningXor(int* pref, int prefSize, int* returnSize) {
    int* arr = malloc(sizeof(int) * prefSize);
    arr[0] = pref[0];
    for (int i = 1; i < prefSize; i++) {
        arr[i] = pref[i] ^ pref[i - 1];
    }
    *returnSize = prefSize;
    return arr;
}
