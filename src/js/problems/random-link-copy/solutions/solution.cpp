class Solution {
public:
    // O(n) time and space. Pass 1 makes a copy of every node; pass 2 wires both pointers through
    // the map, keyed by the original node itself (values can repeat).
    RandomListNode* copyRandomList(RandomListNode* head) {
        unordered_map<RandomListNode*, RandomListNode*> copyOf{{nullptr, nullptr}};
        for (RandomListNode* node = head; node; node = node->next) copyOf[node] = new RandomListNode(node->val);
        for (RandomListNode* node = head; node; node = node->next) {
            copyOf[node]->next = copyOf[node->next];
            copyOf[node]->random = copyOf[node->random];
        }
        return copyOf[head];
    }
};
