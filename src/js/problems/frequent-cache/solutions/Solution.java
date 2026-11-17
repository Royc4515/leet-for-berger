// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0400-0499/0460.LFU%20Cache/Solution.java
import java.util.*;

// O(1) per call: for every use count, a doubly linked list of the nodes with that count in
// recency order (newest first), plus the smallest count that still has nodes.
class LfuCache {

    private final Map<Integer, Node> map;
    private final Map<Integer, DoublyLinkedList> freqMap;
    private final int capacity;
    private int minFreq;

    public LfuCache(int capacity) {
        this.capacity = capacity;
        map = new HashMap<>();
        freqMap = new HashMap<>();
    }

    public int get(int key) {
        Node node = map.get(key);
        if (node == null) {
            return -1;
        }
        incrFreq(node);
        return node.value;
    }

    public void put(int key, int value) {
        Node node = map.get(key);
        if (node != null) {
            // Storing over an existing key is a use as well.
            node.value = value;
            incrFreq(node);
            return;
        }
        if (map.size() == capacity) {
            // The oldest node among those with the smallest count sits at the back of its list.
            DoublyLinkedList list = freqMap.get(minFreq);
            map.remove(list.removeLast().key);
            if (list.isEmpty()) {
                freqMap.remove(minFreq);
            }
        }
        node = new Node(key, value);
        addNode(node);
        map.put(key, node);
        // A new key always has the smallest possible count.
        minFreq = 1;
    }

    private void incrFreq(Node node) {
        int freq = node.freq;
        DoublyLinkedList list = freqMap.get(freq);
        list.remove(node);
        if (list.isEmpty()) {
            freqMap.remove(freq);
            // The node was the last one with the smallest count, and it now has count + 1.
            if (freq == minFreq) {
                minFreq++;
            }
        }
        node.freq++;
        addNode(node);
    }

    private void addNode(Node node) {
        freqMap.computeIfAbsent(node.freq, f -> new DoublyLinkedList()).addFirst(node);
    }

    private static class Node {
        int key;
        int value;
        int freq;
        Node prev;
        Node next;

        Node(int key, int value) {
            this.key = key;
            this.value = value;
            this.freq = 1;
        }
    }

    private static class DoublyLinkedList {

        // Placeholder ends: every real node always has both neighbours.
        private final Node head;
        private final Node tail;

        DoublyLinkedList() {
            head = new Node(-1, -1);
            tail = new Node(-1, -1);
            head.next = tail;
            tail.prev = head;
        }

        void addFirst(Node node) {
            node.prev = head;
            node.next = head.next;
            head.next.prev = node;
            head.next = node;
        }

        Node remove(Node node) {
            node.next.prev = node.prev;
            node.prev.next = node.next;
            node.next = null;
            node.prev = null;
            return node;
        }

        Node removeLast() {
            return remove(tail.prev);
        }

        boolean isEmpty() {
            return head.next == tail;
        }
    }
}
