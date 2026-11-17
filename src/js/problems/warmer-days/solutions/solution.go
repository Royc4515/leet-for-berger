// O(n) time - a stack of days still waiting; their temperatures never rise toward the top.
func dailyTemperatures(temperatures []int) []int {
	answer := make([]int, len(temperatures)) // zero-filled: right for days never answered
	waiting := make([]int, 0, len(temperatures))
	for i, t := range temperatures {
		// Today answers every waiting day that is strictly cooler; equal days keep waiting.
		for len(waiting) > 0 && temperatures[waiting[len(waiting)-1]] < t {
			d := waiting[len(waiting)-1]
			waiting = waiting[:len(waiting)-1]
			answer[d] = i - d
		}
		waiting = append(waiting, i)
	}
	return answer
}
