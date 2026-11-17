// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0000-0099/0002.Add%20Two%20Numbers/Solution.c
// O(max(m, n)) - grade-school addition, one digit per node.
struct ListNode* addTwoNumbers(struct ListNode* l1, struct ListNode* l2) {
    // A placeholder head on the stack avoids special-casing the first output node.
    struct ListNode dummy = {0, NULL};
    struct ListNode* curr = &dummy;
    int carry = 0;

    // Keep going while a carry is left: 999 + 1 needs one node more than either input.
    while (l1 != NULL || l2 != NULL || carry != 0) {
        int sum = carry;
        if (l1 != NULL) {
            sum += l1->val;
            l1 = l1->next;
        }
        if (l2 != NULL) {
            sum += l2->val;
            l2 = l2->next;
        }

        carry = sum / 10;

        struct ListNode* node = malloc(sizeof(struct ListNode));
        node->val = sum % 10;
        node->next = NULL;
        curr->next = node;
        curr = node;
    }

    return dummy.next;
}
