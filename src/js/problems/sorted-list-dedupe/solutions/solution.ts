// O(n) time, O(1) extra space: skip adjacent equal nodes without advancing until the value changes.
function dedupeSortedList(head: ListNode | null): ListNode | null {
  let curr: ListNode | null = head;
  while (curr && curr.next) {
    if (curr.val === curr.next.val) {
      curr.next = curr.next.next;
    } else {
      curr = curr.next;
    }
  }
  return head;
}
