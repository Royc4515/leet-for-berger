// O(1) amortized per operation: parallel slices of values and running minimums.
type MinStack struct {
	vals []int
	mins []int
}

func Constructor() MinStack {
	return MinStack{}
}

func (this *MinStack) Push(val int) {
	// The minimum below an entry never changes while that entry sits on the stack.
	below := val
	if n := len(this.mins); n > 0 && this.mins[n-1] < val {
		below = this.mins[n-1]
	}
	this.vals = append(this.vals, val)
	this.mins = append(this.mins, below)
}

func (this *MinStack) Pop() {
	this.vals = this.vals[:len(this.vals)-1]
	this.mins = this.mins[:len(this.mins)-1]
}

func (this *MinStack) Top() int {
	return this.vals[len(this.vals)-1]
}

func (this *MinStack) GetMin() int {
	return this.mins[len(this.mins)-1]
}
