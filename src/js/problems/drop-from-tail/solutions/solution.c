// O(n) time in one pass, O(1) space: a second pointer trails the first by n nodes.
struct ListNode* dropFromTail(struct ListNode* head, int n) {
    // The placeholder gives the head a predecessor, so dropping the head is not a special case.
    struct ListNode dummy;
    dummy.val = 0;
    dummy.next = head;
    struct ListNode* lead = &dummy;
    for (int i = 0; i < n; i++) lead = lead->next;
    struct ListNode* follow = &dummy;
    // When lead stands on the last node, follow stands right before the node to drop.
    while (lead->next) {
        lead = lead->next;
        follow = follow->next;
    }
    follow->next = follow->next->next;
    return dummy.next;
}
