// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0100-0199/0146.LRU%20Cache/Solution.go
// O(1) per call: a hash map finds a key's node, and a doubly linked list keeps nodes ordered by
// last use (most recent right after head, least recent right before tail).
type cacheNode struct {
	key, val   int
	prev, next *cacheNode
}

type LruCache struct {
	size, capacity int
	head, tail     *cacheNode
	cache          map[int]*cacheNode
}

func Constructor(capacity int) LruCache {
	// Placeholder head and tail: every real node always has both neighbours, so unlinking and
	// inserting never need nil checks.
	head := &cacheNode{}
	tail := &cacheNode{}
	head.next = tail
	tail.prev = head
	return LruCache{
		capacity: capacity,
		head:     head,
		tail:     tail,
		cache:    make(map[int]*cacheNode),
	}
}

func (this *LruCache) Get(key int) int {
	if node, exists := this.cache[key]; exists {
		// A successful read counts as a use, so the node moves to the front.
		this.removeNode(node)
		this.addToHead(node)
		return node.val
	}
	return -1
}

func (this *LruCache) Put(key int, value int) {
	if node, exists := this.cache[key]; exists {
		// Updating an existing key refreshes it but does not grow the cache.
		this.removeNode(node)
		node.val = value
		this.addToHead(node)
		return
	}
	node := &cacheNode{key: key, val: value}
	this.cache[key] = node
	this.addToHead(node)
	if this.size++; this.size > this.capacity {
		lru := this.tail.prev
		delete(this.cache, lru.key)
		this.removeNode(lru)
		this.size--
	}
}

func (this *LruCache) removeNode(node *cacheNode) {
	node.prev.next = node.next
	node.next.prev = node.prev
}

func (this *LruCache) addToHead(node *cacheNode) {
	node.next = this.head.next
	node.prev = this.head
	this.head.next = node
	node.next.prev = node
}
