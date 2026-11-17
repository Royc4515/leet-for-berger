/**
 * O(n) time, O(1) space - iterative rewiring.
 * @param {ListNode} head
 * @return {ListNode}
 */
function reverseList(head) {
  let prev = null;
  while (head) {
    // Save the rest of the list before the pointer that leads to it is overwritten.
    const next = head.next;
    head.next = prev;
    prev = head;
    head = next;
  }
  return prev;
}
