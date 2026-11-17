# Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0600-0699/0632.Smallest%20Range%20Covering%20Elements%20from%20K%20Lists/Solution.py
def smallest_range(nums: list[list[int]]) -> list[int]:
    # O(N log N) time - merge every value with its list index, then slide a window over the
    # merged order: grow on the right, shrink from the left while all k lists are still covered.
    t = sorted((x, i) for i, v in enumerate(nums) for x in v)
    k = len(nums)
    have = [0] * k
    covered = 0
    ans = None
    j = 0
    for b, v in t:
        if have[v] == 0:
            covered += 1
        have[v] += 1
        while covered == k:
            a, w = t[j]
            # Strictly narrower only: b never decreases, so an equally wide window found later
            # starts later, and ties must go to the smaller start.
            if ans is None or b - a < ans[1] - ans[0]:
                ans = [a, b]
            have[w] -= 1
            if have[w] == 0:
                covered -= 1
            j += 1
    return ans
