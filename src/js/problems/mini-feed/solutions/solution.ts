// post, follow and unfollow are O(1); getFeed is O(F + 10 log F) for F followed users. Every tweet
// gets its posting order as a sequence number, and each tweet points to the previous tweet of the
// same author, so a user's tweets are a sorted list reachable newest first. time never decreases,
// so the posting order is also the timestamp order, and between equal timestamps the later call is
// more recent, as the statement asks.

// Moves heap[i] down until neither child is larger (max-heap of sequence numbers).
function siftDown(heap: number[], i: number, n: number): void {
  for (;;) {
    let big = 2 * i + 1;
    if (big >= n) return;
    if (big + 1 < n && heap[big + 1] > heap[big]) big++;
    if (heap[big] <= heap[i]) return;
    const t = heap[i];
    heap[i] = heap[big];
    heap[big] = t;
    i = big;
  }
}

class MiniFeed {
  private ids: number[] = [];
  private prev: number[] = [];
  private head = new Map<number, number>();
  private follows = new Map<number, Set<number>>();

  constructor() {}

  post(userId: number, tweetId: number, time: number): void {
    this.prev.push(this.head.get(userId) ?? -1);
    this.head.set(userId, this.ids.length);
    this.ids.push(tweetId);
  }

  getFeed(userId: number): number[] {
    const heap: number[] = [];
    const own = this.head.get(userId);
    if (own !== undefined) heap.push(own);
    for (const u of this.follows.get(userId) ?? []) {
      const h = this.head.get(u);
      if (h !== undefined) heap.push(h);
    }
    let n = heap.length;
    for (let i = (n >> 1) - 1; i >= 0; i--) siftDown(heap, i, n);
    const feed: number[] = [];
    while (feed.length < 10 && n > 0) {
      const seq = heap[0];
      feed.push(this.ids[seq]);
      const earlier = this.prev[seq];
      // The only new candidate from this author is their next older tweet.
      if (earlier >= 0) heap[0] = earlier;
      else heap[0] = heap[--n];
      siftDown(heap, 0, n);
    }
    return feed;
  }

  follow(followerId: number, followeeId: number): void {
    // Following yourself changes nothing: your own tweets are always in your feed.
    if (followerId === followeeId) return;
    if (!this.follows.has(followerId)) this.follows.set(followerId, new Set());
    this.follows.get(followerId)!.add(followeeId);
  }

  unfollow(followerId: number, followeeId: number): void {
    this.follows.get(followerId)?.delete(followeeId);
  }
}
