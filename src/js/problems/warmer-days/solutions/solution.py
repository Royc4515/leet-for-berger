def daily_temperatures(temperatures: list[int]) -> list[int]:
    # O(n) time - a stack of days still waiting; their temperatures never rise toward the top.
    answer = [0] * len(temperatures)
    waiting = []
    for i, t in enumerate(temperatures):
        # Today answers every waiting day that is strictly cooler; equal days keep waiting.
        while waiting and temperatures[waiting[-1]] < t:
            d = waiting.pop()
            answer[d] = i - d
        waiting.append(i)
    # Days left on the stack never see a warmer day, and their answer is already 0.
    return answer
