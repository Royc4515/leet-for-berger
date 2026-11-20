// O(1) per call: one fixed array, the index of the front item and the item count. Keeping the
// count (instead of a tail index) tells empty from full without wasting a slot.
class RingQueue {
private:
    vector<int> data;
    int cap;
    int head = 0;
    int size = 0;

public:
    RingQueue(int capacity) : data(capacity, 0), cap(capacity) {}

    bool push(int value) {
        if (size == cap) return false;
        // The next free slot is `size` steps after the front, wrapping past the end of the array.
        data[(head + size) % cap] = value;
        size++;
        return true;
    }

    bool pop() {
        if (size == 0) return false;
        head = (head + 1) % cap;
        size--;
        return true;
    }

    int front() {
        return size == 0 ? -1 : data[head];
    }

    int back() {
        return size == 0 ? -1 : data[(head + size - 1) % cap];
    }

    bool isEmpty() {
        return size == 0;
    }

    bool isFull() {
        return size == cap;
    }
};
