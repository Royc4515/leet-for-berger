// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0023.Merge%20k%20Sorted%20Lists/Solution.java
import java.util.*;

class Solution {
    // O(N log k): a min-heap holds the current head of every non-empty list.
    public ListNode mergeKLists(ListNode[] lists) {
        // Integer.compare, not a - b: subtraction is the habit that overflows on wider ranges.
        PriorityQueue<ListNode> pq = new PriorityQueue<>((a, b) -> Integer.compare(a.val, b.val));
        for (ListNode head : lists) {
            if (head != null) {
                pq.offer(head);
            }
        }
        // A placeholder head avoids special-casing the first node of the result.
        ListNode dummy = new ListNode();
        ListNode cur = dummy;
        while (!pq.isEmpty()) {
            ListNode node = pq.poll();
            if (node.next != null) {
                pq.offer(node.next);
            }
            cur.next = node;
            cur = cur.next;
        }
        return dummy.next;
    }
}
