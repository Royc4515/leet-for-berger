// post, follow and unfollow are O(1) apart from the follow list scan; getFeed is O(F + 10 log F)
// for F followed users. Every tweet gets its posting order as a sequence number, and each tweet
// points to the previous tweet of the same author, so a user's tweets are a sorted list reachable
// newest first. time never decreases, so the posting order is also the timestamp order, and between
// equal timestamps the later call is more recent, as the statement asks.
class MiniFeed {
private:
    static const int MAX = 100001; // users and posts are both at most 10^5
    vector<int> ids;
    vector<int> prev;
    vector<int> head;
    vector<vector<int>> follows;

public:
    MiniFeed()
        : head(MAX, -1)
        , follows(MAX) {}

    void post(int userId, int tweetId, int time) {
        prev.push_back(head[userId]);
        head[userId] = (int)ids.size();
        ids.push_back(tweetId);
    }

    vector<int> getFeed(int userId) {
        vector<int> seqs;
        seqs.reserve(follows[userId].size() + 1);
        if (head[userId] >= 0) seqs.push_back(head[userId]);
        for (int u : follows[userId]) if (head[u] >= 0) seqs.push_back(head[u]);
        // Building the heap from the vector is O(F).
        priority_queue<int> heap(less<int>(), std::move(seqs));
        vector<int> feed;
        while ((int)feed.size() < 10 && !heap.empty()) {
            int seq = heap.top();
            heap.pop();
            feed.push_back(ids[seq]);
            // The only new candidate from this author is their next older tweet.
            if (prev[seq] >= 0) heap.push(prev[seq]);
        }
        return feed;
    }

    void follow(int followerId, int followeeId) {
        // Following yourself changes nothing: your own tweets are always in your feed.
        if (followerId == followeeId) return;
        vector<int>& list = follows[followerId];
        if (find(list.begin(), list.end(), followeeId) == list.end()) list.push_back(followeeId);
    }

    void unfollow(int followerId, int followeeId) {
        vector<int>& list = follows[followerId];
        list.erase(remove(list.begin(), list.end(), followeeId), list.end());
    }
};
