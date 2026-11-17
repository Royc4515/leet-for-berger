// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0061.Rotate%20List/Solution.ts
// O(n) time, O(1) space: count, reduce k, then cut once with two pointers.
function rotateRight(head: ListNode | null, k: number): ListNode | null {
  // Checking for an empty list first also avoids k % 0 below.
  if (!head || !head.next) {
    return head;
  }
  let cur: ListNode | null = head;
  let n = 0;
  while (cur) {
    cur = cur.next;
    ++n;
  }
  // Every n rotations is a full turn, so only k mod n steps matter.
  k %= n;
  if (k === 0) {
    return head;
  }
  // fast runs k nodes ahead; when it reaches the tail, slow is the node before the new head.
  let fast: ListNode = head;
  let slow: ListNode = head;
  while (k--) {
    fast = fast.next!;
  }
  while (fast.next) {
    fast = fast.next;
    slow = slow.next!;
  }
  const ans = slow.next;
  slow.next = null;
  fast.next = head;
  return ans;
}
