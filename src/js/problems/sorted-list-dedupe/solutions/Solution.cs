public class Solution {
    // O(n) time, O(1) extra space: skip adjacent equal nodes without advancing until the value changes.
    public ListNode DedupeSortedList(ListNode head) {
        ListNode curr = head;
        while (curr != null && curr.next != null) {
            if (curr.val == curr.next.val) {
                curr.next = curr.next.next;
            } else {
                curr = curr.next;
            }
        }
        return head;
    }
}
