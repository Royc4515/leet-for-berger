def merge_sorted(nums1: list[int], nums2: list[int]) -> list[int]:
    # O(m + n) time - two read heads; the smaller front value is always the next output.
    out = []
    i = j = 0
    while i < len(nums1) and j < len(nums2):
        # <= takes nums1 first on ties, which keeps the merge stable.
        if nums1[i] <= nums2[j]:
            out.append(nums1[i])
            i += 1
        else:
            out.append(nums2[j])
            j += 1
    # At most one of these is non-empty, and what is left is already sorted.
    out.extend(nums1[i:])
    out.extend(nums2[j:])
    return out
