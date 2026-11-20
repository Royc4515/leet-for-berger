class StreakWatch:
    # O(1) per call: one counter holds the length of the current run of target readings.

    def __init__(self, target: int, k: int):
        self.target = target
        self.k = k
        self.run = 0

    def observe(self, reading: int) -> bool:
        # Any other value breaks the run; the last k readings are all the target exactly when the
        # run is at least k long (a longer run keeps answering true).
        self.run = self.run + 1 if reading == self.target else 0
        return self.run >= self.k
