// O(1) amortized per call: timestamps never decrease, so hits form a queue in time order. A
// query drops hits that have left the window from the front; they can never count again
// because later queries only look further ahead.
public class HitCounter {
    private readonly Queue<int> hits = new Queue<int>();

    public HitCounter() {
    }

    public void Hit(int timestamp) {
        hits.Enqueue(timestamp);
    }

    public int GetHits(int timestamp) {
        // The window is (timestamp - 300, timestamp]: anything at or before timestamp - 300 is out.
        while (hits.Count > 0 && hits.Peek() <= timestamp - 300) {
            hits.Dequeue();
        }
        return hits.Count;
    }
}
