// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0400-0499/0460.LFU%20Cache/Solution.go
// O(1) per call: for every use count, a doubly linked list of the nodes with that count in
// recency order (newest first), plus the smallest count that still has nodes.
type LfuCache struct {
	cache    map[int]*lfuNode
	freqMap  map[int]*lfuList
	minFreq  int
	capacity int
}

func Constructor(capacity int) LfuCache {
	return LfuCache{
		cache:    make(map[int]*lfuNode),
		freqMap:  make(map[int]*lfuList),
		capacity: capacity,
	}
}

func (this *LfuCache) Get(key int) int {
	n, ok := this.cache[key]
	if !ok {
		return -1
	}
	this.incrFreq(n)
	return n.val
}

func (this *LfuCache) Put(key int, value int) {
	if n, ok := this.cache[key]; ok {
		// Storing over an existing key is a use as well.
		n.val = value
		this.incrFreq(n)
		return
	}
	if len(this.cache) == this.capacity {
		// The oldest node among those with the smallest count sits at the back of its list.
		l := this.freqMap[this.minFreq]
		delete(this.cache, l.removeBack().key)
		if l.empty() {
			delete(this.freqMap, this.minFreq)
		}
	}
	n := &lfuNode{key: key, val: value, freq: 1}
	this.addNode(n)
	this.cache[key] = n
	// A new key always has the smallest possible count.
	this.minFreq = 1
}

func (this *LfuCache) incrFreq(n *lfuNode) {
	l := this.freqMap[n.freq]
	l.remove(n)
	if l.empty() {
		delete(this.freqMap, n.freq)
		// The node was the last one with the smallest count, and it now has count + 1.
		if n.freq == this.minFreq {
			this.minFreq++
		}
	}
	n.freq++
	this.addNode(n)
}

func (this *LfuCache) addNode(n *lfuNode) {
	l, ok := this.freqMap[n.freq]
	if !ok {
		l = newLfuList()
		this.freqMap[n.freq] = l
	}
	l.pushFront(n)
}

type lfuNode struct {
	key  int
	val  int
	freq int
	prev *lfuNode
	next *lfuNode
}

// A list with placeholder ends: every real node always has both neighbours.
type lfuList struct {
	head *lfuNode
	tail *lfuNode
}

func newLfuList() *lfuList {
	head := new(lfuNode)
	tail := new(lfuNode)
	head.next = tail
	tail.prev = head
	return &lfuList{head: head, tail: tail}
}

func (l *lfuList) pushFront(n *lfuNode) {
	n.prev = l.head
	n.next = l.head.next
	l.head.next.prev = n
	l.head.next = n
}

func (l *lfuList) remove(n *lfuNode) {
	n.prev.next = n.next
	n.next.prev = n.prev
	n.next = nil
	n.prev = nil
}

func (l *lfuList) removeBack() *lfuNode {
	n := l.tail.prev
	l.remove(n)
	return n
}

func (l *lfuList) empty() bool {
	return l.head.next == l.tail
}
