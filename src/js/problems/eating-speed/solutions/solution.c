// O(n log(max pile)) time - hours only fall as speed rises, so binary search the speed.
int minEatingSpeed(int* piles, int pilesSize, int h) {
    // Speed max(piles) finishes every pile in one hour, and h >= pilesSize, so it always works.
    int l = 1, r = 1;
    for (int i = 0; i < pilesSize; i++) if (piles[i] > r) r = piles[i];
    while (l < r) {
        // l + (r - l) / 2: l + r can exceed INT_MAX when both are near 10^9.
        int mid = l + (r - l) / 2;
        // Up to 10^4 * 10^9 hours at speed 1: a 32-bit sum would wrap and look "fast enough".
        long long s = 0;
        for (int i = 0; i < pilesSize; i++) s += (piles[i] + (long long)mid - 1) / mid;
        if (s <= h) r = mid;
        else l = mid + 1;
    }
    return l;
}
