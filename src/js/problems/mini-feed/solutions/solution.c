// post, follow and unfollow are O(1) apart from the follow list scan; getFeed is O(F + 10 log F)
// for F followed users. Every tweet gets its posting order as a sequence number, and each tweet
// points to the previous tweet of the same author, so a user's tweets are a sorted list reachable
// newest first. time never decreases, so the posting order is also the timestamp order, and between
// equal timestamps the later call is more recent, as the statement asks.
#define MAX_USERS 100001 // users and posts are both at most 10^5

typedef struct {
    int ids[MAX_USERS];
    int prev[MAX_USERS];
    int posts;
    int head[MAX_USERS];
    int* followed[MAX_USERS]; // growable list of followee ids per user
    int followedCount[MAX_USERS];
    int followedCap[MAX_USERS];
} MiniFeed;

MiniFeed* miniFeedCreate() {
    MiniFeed* obj = calloc(1, sizeof(MiniFeed));
    for (int u = 0; u < MAX_USERS; u++) obj->head[u] = -1;
    return obj;
}

void miniFeedPost(MiniFeed* obj, int userId, int tweetId, int time) {
    obj->ids[obj->posts] = tweetId;
    obj->prev[obj->posts] = obj->head[userId];
    obj->head[userId] = obj->posts++;
}

// Moves heap[i] down until neither child is larger (max-heap of sequence numbers).
static void siftDown(int* heap, int i, int n) {
    for (;;) {
        int big = 2 * i + 1;
        if (big >= n) return;
        if (big + 1 < n && heap[big + 1] > heap[big]) big++;
        if (heap[big] <= heap[i]) return;
        int t = heap[i];
        heap[i] = heap[big];
        heap[big] = t;
        i = big;
    }
}

int* miniFeedGetFeed(MiniFeed* obj, int userId, int* returnSize) {
    int* heap = malloc(sizeof(int) * (obj->followedCount[userId] + 1));
    int n = 0;
    if (obj->head[userId] >= 0) heap[n++] = obj->head[userId];
    for (int i = 0; i < obj->followedCount[userId]; i++) {
        int h = obj->head[obj->followed[userId][i]];
        if (h >= 0) heap[n++] = h;
    }
    for (int i = n / 2 - 1; i >= 0; i--) siftDown(heap, i, n);
    int* feed = malloc(sizeof(int) * 10);
    int count = 0;
    while (count < 10 && n > 0) {
        int seq = heap[0];
        feed[count++] = obj->ids[seq];
        // The only new candidate from this author is their next older tweet.
        heap[0] = obj->prev[seq] >= 0 ? obj->prev[seq] : heap[--n];
        siftDown(heap, 0, n);
    }
    free(heap);
    *returnSize = count;
    return feed;
}

void miniFeedFollow(MiniFeed* obj, int followerId, int followeeId) {
    // Following yourself changes nothing: your own tweets are always in your feed.
    if (followerId == followeeId) return;
    for (int i = 0; i < obj->followedCount[followerId]; i++) {
        if (obj->followed[followerId][i] == followeeId) return;
    }
    if (obj->followedCount[followerId] == obj->followedCap[followerId]) {
        obj->followedCap[followerId] = obj->followedCap[followerId] ? obj->followedCap[followerId] * 2 : 4;
        obj->followed[followerId] = realloc(obj->followed[followerId], sizeof(int) * obj->followedCap[followerId]);
    }
    obj->followed[followerId][obj->followedCount[followerId]++] = followeeId;
}

void miniFeedUnfollow(MiniFeed* obj, int followerId, int followeeId) {
    int* list = obj->followed[followerId];
    for (int i = 0; i < obj->followedCount[followerId]; i++) {
        if (list[i] == followeeId) {
            // Order inside the list does not matter, so the last entry fills the gap.
            list[i] = list[--obj->followedCount[followerId]];
            return;
        }
    }
}

void miniFeedFree(MiniFeed* obj) {
    for (int u = 0; u < MAX_USERS; u++) free(obj->followed[u]);
    free(obj);
}
