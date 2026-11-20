from heapq import heapify, heappop, heapreplace


class MiniFeed:
    # post, follow and unfollow are O(1); get_feed is O(F + 10 log F) for F followed users. Every
    # tweet gets its posting order as a sequence number, and each tweet points to the previous
    # tweet of the same author, so a user's tweets are a sorted list reachable newest first.
    # time never decreases, so the posting order is also the timestamp order, and between equal
    # timestamps the later call is more recent, as the statement asks.

    def __init__(self):
        self.ids = []
        self.prev = []
        self.head = {}
        self.follows = {}

    def post(self, user_id: int, tweet_id: int, time: int) -> None:
        self.prev.append(self.head.get(user_id, -1))
        self.head[user_id] = len(self.ids)
        self.ids.append(tweet_id)

    def get_feed(self, user_id: int) -> list[int]:
        head = self.head
        # heapq is a min-heap, so sequence numbers are stored negated to pop the newest first.
        heap = [-head[u] for u in self.follows.get(user_id, ()) if u in head]
        if user_id in head:
            heap.append(-head[user_id])
        heapify(heap)
        feed = []
        while heap and len(feed) < 10:
            seq = -heap[0]
            feed.append(self.ids[seq])
            earlier = self.prev[seq]
            if earlier >= 0:
                # The only new candidate from this author is their next older tweet.
                heapreplace(heap, -earlier)
            else:
                heappop(heap)
        return feed

    def follow(self, follower_id: int, followee_id: int) -> None:
        # Following yourself changes nothing: your own tweets are always in your feed.
        if follower_id != followee_id:
            self.follows.setdefault(follower_id, set()).add(followee_id)

    def unfollow(self, follower_id: int, followee_id: int) -> None:
        if follower_id in self.follows:
            self.follows[follower_id].discard(followee_id)
