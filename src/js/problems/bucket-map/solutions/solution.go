// O(1) average per call: separate chaining. 2^17 buckets keep the chains short for up to
// 2 * 10^5 keys.
const bucketBits = 17

type entry struct {
	key, value int
	next       *entry
}

type MyHashMap struct {
	buckets []*entry
}

func Constructor() MyHashMap {
	return MyHashMap{make([]*entry, 1<<bucketBits)}
}

// Multiplicative hashing: the top bits of the product depend on every bit of the key, so
// multiples of 1024 do not pile into a few buckets as key % 2^17 would.
func bucketIndex(key int) int {
	return int((uint32(key) * 2654435761) >> (32 - bucketBits))
}

func (this *MyHashMap) Put(key int, value int) {
	i := bucketIndex(key)
	for e := this.buckets[i]; e != nil; e = e.next {
		if e.key == key {
			// Update in place: adding a second entry would leave a stale copy behind.
			e.value = value
			return
		}
	}
	this.buckets[i] = &entry{key, value, this.buckets[i]}
}

func (this *MyHashMap) Get(key int) int {
	for e := this.buckets[bucketIndex(key)]; e != nil; e = e.next {
		if e.key == key {
			return e.value
		}
	}
	return -1
}

func (this *MyHashMap) Remove(key int) {
	// Walking a pointer to the link itself makes removing the first entry no special case.
	for link := &this.buckets[bucketIndex(key)]; *link != nil; link = &(*link).next {
		if (*link).key == key {
			*link = (*link).next
			return
		}
	}
}
