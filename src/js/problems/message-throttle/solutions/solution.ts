// O(1) per call: one number per message, the earliest time it may be shown again.
class MessageThrottle {
  private cooldown: number;
  private nextAllowed = new Map<string, number>();

  constructor(cooldown: number) {
    this.cooldown = cooldown;
  }

  allow(timestamp: number, message: string): boolean {
    // Only a shown message moves its time: a refused call must not extend its own ban.
    if (timestamp < (this.nextAllowed.get(message) ?? 0)) return false;
    this.nextAllowed.set(message, timestamp + this.cooldown);
    return true;
  }
}
