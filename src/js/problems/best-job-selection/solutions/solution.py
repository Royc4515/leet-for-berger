from bisect import bisect_right


def max_job_profit(start_time: list[int], end_time: list[int], profit: list[int]) -> int:
    # O(n log n) - sort by end time; best[i] is the top profit using the first i jobs, either
    # skipping job i or taking it on top of the best schedule that ends by its start.
    jobs = sorted(zip(end_time, start_time, profit))
    ends = [e for e, _, _ in jobs]
    best = [0] * (len(jobs) + 1)
    for i, (end, start, gain) in enumerate(jobs):
        # `bisect_right` counts the jobs with end <= start: a job may begin exactly when another
        # ends. They all sort before job i because start < end.
        compatible = bisect_right(ends, start)
        best[i + 1] = max(best[i], best[compatible] + gain)
    return best[-1]
