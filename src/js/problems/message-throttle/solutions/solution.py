class MessageThrottle:
    # O(1) per call: one number per message, the earliest time it may be shown again.

    def __init__(self, cooldown: int):
        self.cooldown = cooldown
        self.next_allowed = {}

    def allow(self, timestamp: int, message: str) -> bool:
        # Only a shown message moves its time: a refused call must not extend its own ban.
        if timestamp < self.next_allowed.get(message, 0):
            return False
        self.next_allowed[message] = timestamp + self.cooldown
        return True
