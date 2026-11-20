// O(1) per call: one counter holds the length of the current run of target readings.
type StreakWatch struct {
	target, k, run int
}

func Constructor(target int, k int) StreakWatch {
	return StreakWatch{target: target, k: k}
}

func (this *StreakWatch) Observe(reading int) bool {
	// Any other value breaks the run; the last k readings are all the target exactly when the
	// run is at least k long (a longer run keeps answering true).
	if reading == this.target {
		this.run++
	} else {
		this.run = 0
	}
	return this.run >= this.k
}
