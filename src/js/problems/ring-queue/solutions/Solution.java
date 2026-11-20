// O(1) per call: one fixed array, the index of the front item and the item count. Keeping the
// count (instead of a tail index) tells empty from full without wasting a slot.
class RingQueue {
    private final int[] data;
    private final int cap;
    private int head = 0;
    private int size = 0;

    public RingQueue(int capacity) {
        data = new int[capacity];
        cap = capacity;
    }

    public boolean push(int value) {
        if (size == cap) return false;
        // The next free slot is `size` steps after the front, wrapping past the end of the array.
        data[(head + size) % cap] = value;
        size++;
        return true;
    }

    public boolean pop() {
        if (size == 0) return false;
        head = (head + 1) % cap;
        size--;
        return true;
    }

    public int front() {
        return size == 0 ? -1 : data[head];
    }

    public int back() {
        return size == 0 ? -1 : data[(head + size - 1) % cap];
    }

    public boolean isEmpty() {
        return size == 0;
    }

    public boolean isFull() {
        return size == cap;
    }
}
