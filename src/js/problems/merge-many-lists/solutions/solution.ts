// O(N log k): merge the lists in pairs, round after round. Each round walks every node once,
// and the number of lists halves each round.
function mergeKLists(lists: Array<ListNode | null>): ListNode | null {
  if (lists.length === 0) return null;
  let round = lists;
  while (round.length > 1) {
    const next: Array<ListNode | null> = [];
    for (let i = 0; i < round.length; i += 2) next.push(mergeTwo(round[i], round[i + 1] ?? null));
    round = next;
  }
  return round[0];
}

/** Splices two sorted lists together without allocating nodes. */
function mergeTwo(a: ListNode | null, b: ListNode | null): ListNode | null {
  // A placeholder head avoids special-casing the first node of the result.
  const dummy = new ListNode();
  let tail = dummy;
  while (a && b) {
    if (a.val <= b.val) {
      tail.next = a;
      a = a.next;
    } else {
      tail.next = b;
      b = b.next;
    }
    tail = tail.next;
  }
  tail.next = a ?? b;
  return dummy.next;
}
