def majority_element(nums: list[int]) -> int:
    # O(n) time, O(1) space - a candidate and a tally; every different value cancels one copy of it.
    candidate, tally = 0, 0
    for v in nums:
        if tally == 0:
            # The prefix so far cancelled out evenly, so the majority is still the majority of the rest.
            candidate = v
        tally += 1 if v == candidate else -1
    return candidate
