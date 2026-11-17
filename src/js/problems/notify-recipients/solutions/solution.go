import (
	"sort"
	"strconv"
	"strings"
)

// O(M + R + K log K) time, O(M + K) space - index groups once.
func notifyRecipients(users [][]int, requests []string) []int {
	known := map[int]bool{}
	members := map[int][]int{}
	for _, row := range users {
		known[row[0]] = true
		for _, g := range row[1:] {
			members[g] = append(members[g], row[0])
		}
	}
	out := map[int]bool{}
	expanded := map[int]bool{}
	for _, r := range requests {
		kind, raw, _ := strings.Cut(r, ":")
		id, _ := strconv.Atoi(raw)
		if kind == "user" {
			if known[id] {
				out[id] = true
			}
		} else if !expanded[id] {
			// Walk each group at most once: repeated group requests add nothing new.
			expanded[id] = true
			for _, u := range members[id] {
				out[u] = true
			}
		}
	}
	result := make([]int, 0, len(out))
	for u := range out {
		result = append(result, u)
	}
	sort.Ints(result)
	return result
}
