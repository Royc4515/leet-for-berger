const maxUsers = 100001 // users and posts are both at most 10^5

// post, follow and unfollow are O(1) apart from the follow list scan; GetFeed is O(F + 10 log F)
// for F followed users. Every tweet gets its posting order as a sequence number, and each tweet
// points to the previous tweet of the same author, so a user's tweets are a sorted list reachable
// newest first. time never decreases, so the posting order is also the timestamp order, and between
// equal timestamps the later call is more recent, as the statement asks.
type MiniFeed struct {
	ids     []int
	prev    []int
	head    []int
	follows [][]int
}

func Constructor() MiniFeed {
	head := make([]int, maxUsers)
	for i := range head {
		head[i] = -1
	}
	return MiniFeed{head: head, follows: make([][]int, maxUsers)}
}

func (this *MiniFeed) Post(userId int, tweetId int, time int) {
	this.prev = append(this.prev, this.head[userId])
	this.head[userId] = len(this.ids)
	this.ids = append(this.ids, tweetId)
}

// siftDown moves heap[i] down until neither child is larger (max-heap of sequence numbers).
func siftDown(heap []int, i, n int) {
	for {
		big := 2*i + 1
		if big >= n {
			return
		}
		if big+1 < n && heap[big+1] > heap[big] {
			big++
		}
		if heap[big] <= heap[i] {
			return
		}
		heap[i], heap[big] = heap[big], heap[i]
		i = big
	}
}

func (this *MiniFeed) GetFeed(userId int) []int {
	heap := make([]int, 0, len(this.follows[userId])+1)
	if this.head[userId] >= 0 {
		heap = append(heap, this.head[userId])
	}
	for _, u := range this.follows[userId] {
		if this.head[u] >= 0 {
			heap = append(heap, this.head[u])
		}
	}
	n := len(heap)
	for i := n/2 - 1; i >= 0; i-- {
		siftDown(heap, i, n)
	}
	feed := make([]int, 0, 10)
	for len(feed) < 10 && n > 0 {
		seq := heap[0]
		feed = append(feed, this.ids[seq])
		// The only new candidate from this author is their next older tweet.
		if this.prev[seq] >= 0 {
			heap[0] = this.prev[seq]
		} else {
			n--
			heap[0] = heap[n]
		}
		siftDown(heap, 0, n)
	}
	return feed
}

func (this *MiniFeed) Follow(followerId int, followeeId int) {
	// Following yourself changes nothing: your own tweets are always in your feed.
	if followerId == followeeId {
		return
	}
	for _, u := range this.follows[followerId] {
		if u == followeeId {
			return
		}
	}
	this.follows[followerId] = append(this.follows[followerId], followeeId)
}

func (this *MiniFeed) Unfollow(followerId int, followeeId int) {
	list := this.follows[followerId]
	for i, u := range list {
		if u == followeeId {
			// Order inside the list does not matter, so the last entry fills the gap.
			list[i] = list[len(list)-1]
			this.follows[followerId] = list[:len(list)-1]
			return
		}
	}
}
