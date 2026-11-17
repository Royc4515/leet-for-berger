import "math/rand"

// O(1) average per operation: the values sit in a dense array for uniform picks, and a map from
// value to array index makes membership and removal constant time.
type RandomizedSet struct {
	values []int
	index  map[int]int
}

func Constructor() RandomizedSet {
	return RandomizedSet{index: map[int]int{}}
}

func (this *RandomizedSet) Insert(val int) bool {
	if _, ok := this.index[val]; ok {
		return false
	}
	this.index[val] = len(this.values)
	this.values = append(this.values, val)
	return true
}

func (this *RandomizedSet) Remove(val int) bool {
	i, ok := this.index[val]
	if !ok {
		return false
	}
	delete(this.index, val)
	// Order does not matter, so the last value fills the hole and the array stays dense.
	last := this.values[len(this.values)-1]
	this.values = this.values[:len(this.values)-1]
	if i < len(this.values) {
		this.values[i] = last
		this.index[last] = i
	}
	return true
}

func (this *RandomizedSet) GetRandom() int {
	return this.values[rand.Intn(len(this.values))]
}
