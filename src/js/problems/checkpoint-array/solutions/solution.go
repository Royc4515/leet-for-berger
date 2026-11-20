import "sort"

// set and snap are O(1), get is O(log w): per slot, only the writes are stored, tagged with the
// checkpoint they were made under. Ids only grow, so each slot's list stays sorted.
type slotWrite struct{ id, val int }

type CheckpointArray struct {
	history map[int][]slotWrite
	taken   int
}

func Constructor(length int) CheckpointArray {
	return CheckpointArray{history: map[int][]slotWrite{}}
}

func (this *CheckpointArray) Set(index int, val int) {
	h := this.history[index]
	// A second write inside the same checkpoint replaces the first one.
	if n := len(h); n > 0 && h[n-1].id == this.taken {
		h[n-1].val = val
		return
	}
	this.history[index] = append(h, slotWrite{this.taken, val})
}

func (this *CheckpointArray) Snap() int {
	this.taken++
	return this.taken - 1
}

func (this *CheckpointArray) Get(index int, snapId int) int {
	h := this.history[index]
	// First write made under an id > snapId; the one before it is the answer.
	pos := sort.Search(len(h), func(i int) bool { return h[i].id > snapId })
	if pos == 0 {
		return 0
	}
	return h[pos-1].val
}
