// post, follow and unfollow are O(1) apart from the follow list scan; GetFeed is O(F + 10 log F)
// for F followed users. Every tweet gets its posting order as a sequence number, and each tweet
// points to the previous tweet of the same author, so a user's tweets are a sorted list reachable
// newest first. time never decreases, so the posting order is also the timestamp order, and between
// equal timestamps the later call is more recent, as the statement asks.
public class MiniFeed {
    private const int Max = 100001; // users and posts are both at most 10^5
    private readonly int[] ids = new int[Max];
    private readonly int[] prev = new int[Max];
    private int posts = 0;
    private readonly int[] head = new int[Max];
    private readonly Dictionary<int, List<int>> follows = new Dictionary<int, List<int>>();

    public MiniFeed() {
        Array.Fill(head, -1);
    }

    public void Post(int userId, int tweetId, int time) {
        ids[posts] = tweetId;
        prev[posts] = head[userId];
        head[userId] = posts++;
    }

    public int[] GetFeed(int userId) {
        List<int> followed;
        int[] heap = new int[(follows.TryGetValue(userId, out followed) ? followed.Count : 0) + 1];
        int n = 0;
        if (head[userId] >= 0) heap[n++] = head[userId];
        if (followed != null) {
            foreach (int u in followed) if (head[u] >= 0) heap[n++] = head[u];
        }
        for (int i = n / 2 - 1; i >= 0; i--) SiftDown(heap, i, n);
        int[] feed = new int[10];
        int count = 0;
        while (count < 10 && n > 0) {
            int seq = heap[0];
            feed[count++] = ids[seq];
            // The only new candidate from this author is their next older tweet.
            heap[0] = prev[seq] >= 0 ? prev[seq] : heap[--n];
            SiftDown(heap, 0, n);
        }
        return feed[..count];
    }

    public void Follow(int followerId, int followeeId) {
        // Following yourself changes nothing: your own tweets are always in your feed.
        if (followerId == followeeId) return;
        if (!follows.TryGetValue(followerId, out var list)) {
            list = new List<int>();
            follows[followerId] = list;
        }
        if (!list.Contains(followeeId)) list.Add(followeeId);
    }

    public void Unfollow(int followerId, int followeeId) {
        if (follows.TryGetValue(followerId, out var list)) list.Remove(followeeId);
    }

    // Moves heap[i] down until neither child is larger (max-heap of sequence numbers).
    private static void SiftDown(int[] heap, int i, int n) {
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
