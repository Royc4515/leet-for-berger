import java.util.*;

// post, follow and unfollow are O(1) apart from the follow list scan; getFeed is O(F + 10 log F)
// for F followed users. Every tweet gets its posting order as a sequence number, and each tweet
// points to the previous tweet of the same author, so a user's tweets are a sorted list reachable
// newest first. time never decreases, so the posting order is also the timestamp order, and between
// equal timestamps the later call is more recent, as the statement asks.
class MiniFeed {
    private static final int MAX = 100001; // users and posts are both at most 10^5
    private final int[] ids = new int[MAX];
    private final int[] prev = new int[MAX];
    private int posts = 0;
    private final int[] head = new int[MAX];
    private final Map<Integer, List<Integer>> follows = new HashMap<>();

    public MiniFeed() {
        Arrays.fill(head, -1);
    }

    public void post(int userId, int tweetId, int time) {
        ids[posts] = tweetId;
        prev[posts] = head[userId];
        head[userId] = posts++;
    }

    public int[] getFeed(int userId) {
        List<Integer> followed = follows.getOrDefault(userId, Collections.emptyList());
        int[] heap = new int[followed.size() + 1];
        int n = 0;
        if (head[userId] >= 0) heap[n++] = head[userId];
        for (int u : followed) if (head[u] >= 0) heap[n++] = head[u];
        for (int i = n / 2 - 1; i >= 0; i--) siftDown(heap, i, n);
        int[] feed = new int[10];
        int count = 0;
        while (count < 10 && n > 0) {
            int seq = heap[0];
            feed[count++] = ids[seq];
            // The only new candidate from this author is their next older tweet.
            heap[0] = prev[seq] >= 0 ? prev[seq] : heap[--n];
            siftDown(heap, 0, n);
        }
        return Arrays.copyOf(feed, count);
    }

    public void follow(int followerId, int followeeId) {
        // Following yourself changes nothing: your own tweets are always in your feed.
        if (followerId == followeeId) return;
        List<Integer> list = follows.computeIfAbsent(followerId, k -> new ArrayList<>());
        if (!list.contains(followeeId)) list.add(followeeId);
    }

    public void unfollow(int followerId, int followeeId) {
        List<Integer> list = follows.get(followerId);
        if (list != null) list.remove(Integer.valueOf(followeeId));
    }

    // Moves heap[i] down until neither child is larger (max-heap of sequence numbers).
    private static void siftDown(int[] heap, int i, int n) {
        while (true) {
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
}
