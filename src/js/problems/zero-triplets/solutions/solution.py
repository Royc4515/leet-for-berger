def three_sum(nums: list[int]) -> list[list[int]]:
    # O(n^2) time - sort, fix the smallest value, then two pointers on the rest.
    a = sorted(nums)
    n = len(a)
    out = []
    for i in range(n - 2):
        # Sorted: once the smallest value is positive, no triplet can reach zero.
        if a[i] > 0:
            break
        # Equal neighbours would produce the same triplets again.
        if i > 0 and a[i] == a[i - 1]:
            continue
        lo, hi = i + 1, n - 1
        while lo < hi:
            s = a[i] + a[lo] + a[hi]
            if s < 0:
                lo += 1
            elif s > 0:
                hi -= 1
            else:
                out.append([a[i], a[lo], a[hi]])
                lo += 1
                hi -= 1
                # Step past repeats of the pair just used, so it is reported once.
                while lo < hi and a[lo] == a[lo - 1]:
                    lo += 1
                while lo < hi and a[hi] == a[hi + 1]:
                    hi -= 1
    return out
