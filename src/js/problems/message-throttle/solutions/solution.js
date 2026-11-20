// O(1) per call: one number per message, the earliest time it may be shown again.
class MessageThrottle {
  /**
   * @param {number} cooldown
   */
  constructor(cooldown) {
    this.cooldown = cooldown;
    this.nextAllowed = new Map();
  }

  /**
   * @param {number} timestamp
   * @param {string} message
   * @return {boolean}
   */
  allow(timestamp, message) {
    // Only a shown message moves its time: a refused call must not extend its own ban.
    if (timestamp < (this.nextAllowed.get(message) ?? 0)) return false;
    this.nextAllowed.set(message, timestamp + this.cooldown);
    return true;
  }
}
