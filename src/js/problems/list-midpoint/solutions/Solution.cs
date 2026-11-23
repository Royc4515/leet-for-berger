public class Solution {
    // O(n) time, O(1) extra space: advance slow by 1 and fast by 2 to land on floor(n / 2).
    public ListNode MiddleNode(ListNode head) {
        ListNode slow = head;
        ListNode fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }
        return slow;
    }
}
