// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0002.Add%20Two%20Numbers/Solution.ts
// O(max(m, n)) - grade-school addition, one digit per node.
function addTwoNumbers(l1: ListNode | null, l2: ListNode | null): ListNode | null {
  // A placeholder head avoids special-casing the first output node.
  const dummy = new ListNode();
  let cur = dummy;
  // Holds the column sum and, after the division, the carry into the next column.
  let sum = 0;
  // Keep going while a carry is left: 999 + 1 needs one node more than either input.
  while (l1 != null || l2 != null || sum !== 0) {
    if (l1 != null) {
      sum += l1.val;
      l1 = l1.next;
    }
    if (l2 != null) {
      sum += l2.val;
      l2 = l2.next;
    }
    cur.next = new ListNode(sum % 10);
    cur = cur.next;
    sum = Math.floor(sum / 10);
  }
  return dummy.next;
}
