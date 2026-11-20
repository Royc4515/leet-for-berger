public class Solution {
    // O(n) time in one pass, O(1) space: a second pointer trails the first by n nodes.
    public ListNode DropFromTail(ListNode head, int n) {
        // The placeholder gives the head a predecessor, so dropping the head is not a special case.
        ListNode dummy = new ListNode(0, head);
        ListNode lead = dummy;
        for (int i = 0; i < n; i++) {
            lead = lead.next;
        }
        ListNode follow = dummy;
        // When lead stands on the last node, follow stands right before the node to drop.
        while (lead.next != null) {
            lead = lead.next;
            follow = follow.next;
        }
        follow.next = follow.next.next;
        return dummy.next;
    }
}
