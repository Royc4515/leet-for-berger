// O(N log k): merge the lists in pairs, round after round. Each round walks every node once,
// and the number of lists halves each round.

// Splices two sorted lists together without allocating nodes.
static struct ListNode* mergeTwo(struct ListNode* a, struct ListNode* b) {
    // A placeholder head on the stack avoids special-casing the first node of the result.
    struct ListNode dummy = {0, NULL};
    struct ListNode* tail = &dummy;
    while (a && b) {
        if (a->val <= b->val) {
            tail->next = a;
            a = a->next;
        } else {
            tail->next = b;
            b = b->next;
        }
        tail = tail->next;
    }
    tail->next = a ? a : b;
    return dummy.next;
}

struct ListNode* mergeKLists(struct ListNode** lists, int listsSize) {
    if (listsSize == 0) return NULL;
    // Merge in place: after each round the merged lists sit in the first half of the array.
    // The array belongs to the caller but only the pointers in it change, never its length.
    for (int n = listsSize; n > 1; n = (n + 1) / 2) {
        for (int i = 0; i < n / 2; i++) lists[i] = mergeTwo(lists[2 * i], lists[2 * i + 1]);
        // An odd list out moves along unmerged to the next round.
        if (n % 2) lists[n / 2] = lists[n - 1];
    }
    return lists[0];
}
