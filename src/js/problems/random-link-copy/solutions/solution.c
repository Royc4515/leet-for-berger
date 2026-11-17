// O(n) time, O(1) extra space. C has no hash map, so each copy sits right after its original for
// a while: then the copy of x->random is x->random->next. Pass 3 unweaves both lists, which also
// restores the original.
struct RandomListNode* copyRandomList(struct RandomListNode* head) {
    for (struct RandomListNode* x = head; x; x = x->next->next) {
        struct RandomListNode* copy = malloc(sizeof(struct RandomListNode));
        copy->val = x->val;
        copy->random = NULL;
        copy->next = x->next;
        x->next = copy;
    }
    for (struct RandomListNode* x = head; x; x = x->next->next) {
        if (x->random) x->next->random = x->random->next;
    }
    struct RandomListNode dummy = { 0, NULL, NULL };
    struct RandomListNode* tail = &dummy;
    for (struct RandomListNode* x = head; x; x = x->next) {
        tail->next = x->next;
        tail = tail->next;
        x->next = tail->next;
    }
    return dummy.next;
}
