// O(n) time, O(1) extra space: advance slow by 1 and fast by 2 to land on floor(n / 2).
function middleNode(head: ListNode | null): ListNode | null {
  let slow: ListNode | null = head;
  let fast: ListNode | null = head;
  while (fast && fast.next) {
    slow = slow!.next;
    fast = fast.next.next;
  }
  return slow;
}
