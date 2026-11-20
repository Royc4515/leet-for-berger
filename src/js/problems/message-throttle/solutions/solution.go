// O(1) per call: one number per message, the earliest time it may be shown again.
type MessageThrottle struct {
	cooldown    int
	nextAllowed map[string]int
}

func Constructor(cooldown int) MessageThrottle {
	return MessageThrottle{cooldown: cooldown, nextAllowed: map[string]int{}}
}

func (this *MessageThrottle) Allow(timestamp int, message string) bool {
	// Only a shown message moves its time: a refused call must not extend its own ban.
	if next, ok := this.nextAllowed[message]; ok && timestamp < next {
		return false
	}
	this.nextAllowed[message] = timestamp + this.cooldown
	return true
}
