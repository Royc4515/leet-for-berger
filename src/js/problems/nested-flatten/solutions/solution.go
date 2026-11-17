// O(1) amortized per call, O(depth) space: an explicit stack replaces the recursion, and each list
// item is visited once over the whole run.
type frame struct {
	items []*NestedInteger
	pos   int
}

type NestedIterator struct {
	stack []frame
}

func Constructor(nestedList []*NestedInteger) NestedIterator {
	return NestedIterator{stack: []frame{{items: nestedList}}}
}

func (this *NestedIterator) Next() int {
	this.HasNext()
	top := &this.stack[len(this.stack)-1]
	v := top.items[top.pos].GetInteger()
	top.pos++
	return v
}

// Settles on the next integer without consuming it, so calling this twice changes nothing.
func (this *NestedIterator) HasNext() bool {
	for len(this.stack) > 0 {
		top := &this.stack[len(this.stack)-1]
		if top.pos == len(top.items) {
			this.stack = this.stack[:len(this.stack)-1]
			continue
		}
		item := top.items[top.pos]
		if item.IsInteger() {
			return true
		}
		top.pos++
		this.stack = append(this.stack, frame{items: item.GetList()})
	}
	return false
}
