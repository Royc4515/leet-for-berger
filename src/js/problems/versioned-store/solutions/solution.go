// Adapted from doocs/leetcode (CC BY-SA 4.0): https://github.com/doocs/leetcode/blob/HEAD/solution/0900-0999/0981.Time%20Based%20Key-Value%20Store/Solution.go
import "sort"

// O(1) per set, O(log n) per get: set timestamps only increase, so appending keeps each key's
// versions sorted by time and a get is one binary search.
type TimeMap struct {
	ktv map[string][]version
}

func Constructor() TimeMap {
	return TimeMap{map[string][]version{}}
}

func (this *TimeMap) Set(key string, value string, timestamp int) {
	this.ktv[key] = append(this.ktv[key], version{timestamp, value})
}

func (this *TimeMap) Get(key string, timestamp int) string {
	pairs := this.ktv[key]
	// The first version stamped after `timestamp`; the answer is the one just before it.
	i := sort.Search(len(pairs), func(i int) bool { return pairs[i].t > timestamp })
	if i > 0 {
		return pairs[i-1].v
	}
	return ""
}

type version struct {
	t int
	v string
}
