// O(1) per call: one number per message, the earliest time it may be shown again.
class MessageThrottle {
private:
    int cooldown;
    unordered_map<string, int> nextAllowed;

public:
    MessageThrottle(int cooldown) : cooldown(cooldown) {}

    bool allow(int timestamp, string message) {
        auto it = nextAllowed.find(message);
        // Only a shown message moves its time: a refused call must not extend its own ban.
        if (it != nextAllowed.end() && timestamp < it->second) return false;
        nextAllowed[message] = timestamp + cooldown;
        return true;
    }
};
