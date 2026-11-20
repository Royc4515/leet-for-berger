import java.util.HashMap;
import java.util.Map;

// O(1) per call: one number per message, the earliest time it may be shown again.
class MessageThrottle {
    private final int cooldown;
    private final Map<String, Integer> nextAllowed = new HashMap<>();

    public MessageThrottle(int cooldown) {
        this.cooldown = cooldown;
    }

    public boolean allow(int timestamp, String message) {
        // Only a shown message moves its time: a refused call must not extend its own ban.
        if (timestamp < nextAllowed.getOrDefault(message, 0)) return false;
        nextAllowed.put(message, timestamp + cooldown);
        return true;
    }
}
