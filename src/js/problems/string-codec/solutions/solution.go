import (
	"strconv"
	"strings"
)

// O(total length) per call. Length framing: the decoder reads a number, then copies exactly that
// many bytes, so no character inside a string ever needs escaping.
type Codec struct {
}

func Constructor() Codec {
	return Codec{}
}

func (this *Codec) Encode(strs []string) string {
	// One Builder: concatenating strings in a loop copies the whole prefix every time.
	var b strings.Builder
	for _, s := range strs {
		b.WriteString(strconv.Itoa(len(s)))
		b.WriteByte('#')
		b.WriteString(s)
	}
	return b.String()
}

func (this *Codec) Decode(s string) []string {
	out := []string{}
	for i := 0; i < len(s); {
		// The first '#' after i ends the length; the string itself may contain more of them.
		j := i + strings.IndexByte(s[i:], '#')
		size, _ := strconv.Atoi(s[i:j])
		out = append(out, s[j+1:j+1+size])
		// Move an index instead of cutting off the decoded prefix.
		i = j + 1 + size
	}
	return out
}
