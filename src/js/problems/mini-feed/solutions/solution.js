// post, follow and unfollow are O(1); getFeed is O(F + 10 log F) for F followed users. Every tweet
// gets its posting order as a sequence number, and each tweet points to the previous tweet of the
// same author, so a user's tweets are a sorted list reachable newest first. time never decreases,
// so the posting order is also the timestamp order, and between equal timestamps the later call is
// more recent, as the statement asks.

// Moves heap[i] down until neither child is larger (max-heap of sequence numbers).
function siftDown(heap, i, n) {
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
  constructor() {
    this.ids = [];
    this.prev = [];
    this.head = new Map();
    this.follows = new Map();
  }

  /**
   * @param {number} userId
   * @param {number} tweetId
   * @param {number} time
   * @return {void}
   */
  post(userId, tweetId, time) {
    this.prev.push(this.head.get(userId) ?? -1);
    this.head.set(userId, this.ids.length);
    this.ids.push(tweetId);
  }

  /**
   * @param {number} userId
   * @return {number[]}
   */
  getFeed(userId) {
    const heap = [];
    const own = this.head.get(userId);
    if (own !== undefined) heap.push(own);
    for (const u of this.follows.get(userId) ?? []) {
      const h = this.head.get(u);
      if (h !== undefined) heap.push(h);
    }
    let n = heap.length;
    for (let i = (n >> 1) - 1; i >= 0; i--) siftDown(heap, i, n);
    const feed = [];
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

  /**
   * @param {number} followerId
   * @param {number} followeeId
   * @return {void}
   */
  follow(followerId, followeeId) {
    // Following yourself changes nothing: your own tweets are always in your feed.
    if (followerId === followeeId) return;
    if (!this.follows.has(followerId)) this.follows.set(followerId, new Set());
    this.follows.get(followerId).add(followeeId);
  }

  /**
   * @param {number} followerId
   * @param {number} followeeId
   * @return {void}
   */
  unfollow(followerId, followeeId) {
    this.follows.get(followerId)?.delete(followeeId);
  }
}
