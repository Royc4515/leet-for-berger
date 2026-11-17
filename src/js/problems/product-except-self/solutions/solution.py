def product_except_self(nums: list[int]) -> list[int]:
    # O(n) time, O(1) extra space besides the output: left products first, right products second.
    n = len(nums)
    answer = [1] * n
    # answer[i] holds the product of everything left of i; division is out because of zeros.
    left = 1
    for i in range(n):
        answer[i] = left
        left *= nums[i]
    # A single running value is enough for the right side, so no second array is needed.
    right = 1
    for i in range(n - 1, -1, -1):
        answer[i] *= right
        right *= nums[i]
    return answer
