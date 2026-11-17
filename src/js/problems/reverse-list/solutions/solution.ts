// O(n) time, O(1) space - iterative rewiring.
function reverseList(head: ListNode | null): ListNode | null {
  let prev: ListNode | null = null;
  while (head) {
    // Save the rest of the list before the pointer that leads to it is overwritten.
    const next: ListNode | null = head.next;
    head.next = prev;
    prev = head;
    head = next;
  }
  return prev;
}
