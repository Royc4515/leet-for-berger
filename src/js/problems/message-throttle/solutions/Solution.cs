using System.Collections.Generic;

// O(1) per call: one number per message, the earliest time it may be shown again.
public class MessageThrottle {
    private readonly int cooldown;
    private readonly Dictionary<string, int> nextAllowed = new Dictionary<string, int>();

    public MessageThrottle(int cooldown) {
        this.cooldown = cooldown;
    }

    public bool Allow(int timestamp, string message) {
        // Only a shown message moves its time: a refused call must not extend its own ban.
        if (nextAllowed.TryGetValue(message, out int next) && timestamp < next) return false;
        nextAllowed[message] = timestamp + cooldown;
        return true;
    }
}
