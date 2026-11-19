// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0700-0799/0705.Design%20HashSet/Solution.go
// O(1) average per call: separate chaining. 2^17 buckets keep the chains short for up to
// 2 * 10^5 keys; a flag per possible key would need 10^9 entries.
const bucketBits = 17

type node struct {
	key  int
	next *node
}

type MyHashSet struct {
	buckets []*node
}

func Constructor() MyHashSet {
	return MyHashSet{make([]*node, 1<<bucketBits)}
}

// Multiplicative hashing: the top bits of the product depend on every bit of the key, so
// multiples of 1024 do not pile into a few buckets as key % 2^17 would.
func bucketIndex(key int) int {
	return int((uint32(key) * 2654435761) >> (32 - bucketBits))
}

func (this *MyHashSet) Add(key int) {
	// Store each key once, so a single remove really takes it out.
	if this.Contains(key) {
		return
	}
	i := bucketIndex(key)
	this.buckets[i] = &node{key, this.buckets[i]}
}

func (this *MyHashSet) Remove(key int) {
	// Walking a pointer to the link itself makes removing the first node no special case.
	for link := &this.buckets[bucketIndex(key)]; *link != nil; link = &(*link).next {
		if (*link).key == key {
			*link = (*link).next
			return
		}
	}
}

func (this *MyHashSet) Contains(key int) bool {
	for n := this.buckets[bucketIndex(key)]; n != nil; n = n.next {
		if n.key == key {
			return true
		}
	}
	return false
}
