import (
	"strconv"
	"strings"
)

// Pre-order with "#" for missing children: O(n) per call. The token position is a local, never
// a field, so every Deserialize call starts from the beginning.
type Codec struct {
}

func Constructor() Codec {
	return Codec{}
}

func (this *Codec) Serialize(root *TreeNode) string {
	var tokens []string
	var walk func(*TreeNode)
	walk = func(node *TreeNode) {
		if node == nil {
			tokens = append(tokens, "#")
			return
		}
		tokens = append(tokens, strconv.Itoa(node.Val))
		walk(node.Left)
		walk(node.Right)
	}
	walk(root)
	// One join at the end instead of repeated concatenation keeps this linear.
	return strings.Join(tokens, ",")
}

func (this *Codec) Deserialize(data string) *TreeNode {
	tokens := strings.Split(data, ",")
	pos := 0
	var build func() *TreeNode
	build = func() *TreeNode {
		token := tokens[pos]
		pos++
		if token == "#" {
			return nil
		}
		v, _ := strconv.Atoi(token)
		node := &TreeNode{Val: v}
		// Pre-order: the whole left subtree comes before the right one.
		node.Left = build()
		node.Right = build()
		return node
	}
	return build()
}
