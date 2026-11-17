// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0300-0399/0362.Design%20Hit%20Counter/Solution.java
import java.util.*;

// O(1) amortized per hit, O(log n) per query: timestamps never decrease, so the array of hits is
// already sorted and the window start is one binary search away.
class HitCounter {
    // A growable int array: a List<Integer> would box every timestamp.
    private int[] ts = new int[16];
    private int size = 0;

    public HitCounter() {
    }

    public void hit(int timestamp) {
        if (size == ts.length) {
            ts = Arrays.copyOf(ts, size * 2);
        }
        ts[size++] = timestamp;
    }

    public int getHits(int timestamp) {
        // The window is (timestamp - 300, timestamp]: its oldest second is timestamp - 299.
        int l = search(timestamp - 300 + 1);
        return size - l;
    }

    // First index whose hit is at or after x.
    private int search(int x) {
        int l = 0, r = size;
        while (l < r) {
            int mid = (l + r) >> 1;
            if (ts[mid] >= x) {
                r = mid;
            } else {
                l = mid + 1;
            }
        }
        return l;
    }
}
