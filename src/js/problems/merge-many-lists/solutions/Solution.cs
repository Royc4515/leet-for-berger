// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0023.Merge%20k%20Sorted%20Lists/Solution.cs
public class Solution {
    // O(N log k): a min-heap holds the current head of every non-empty list.
    public ListNode MergeKLists(ListNode[] lists) {
        PriorityQueue<ListNode, int> pq = new PriorityQueue<ListNode, int>();
        foreach (var head in lists) {
            if (head != null) {
                pq.Enqueue(head, head.val);
            }
        }
        // A placeholder head avoids special-casing the first node of the result.
        var dummy = new ListNode();
        var cur = dummy;
        while (pq.Count > 0) {
            var node = pq.Dequeue();
            cur.next = node;
            cur = cur.next;
            if (node.next != null) {
                pq.Enqueue(node.next, node.next.val);
            }
        }
        return dummy.next;
    }
}
