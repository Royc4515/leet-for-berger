public class Solution {
    // O(n) time, O(1) space - iterative rewiring.
    public ListNode ReverseList(ListNode head) {
        ListNode prev = null;
        while (head != null) {
            // Save the rest of the list before the pointer that leads to it is overwritten.
            ListNode next = head.next;
            head.next = prev;
            prev = head;
            head = next;
        }
        return prev;
    }
}
