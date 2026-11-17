import java.util.*;

// O(total length) per call. Length framing: the decoder reads a number, then copies exactly that
// many characters, so no character inside a string ever needs escaping.
class Codec {
    public Codec() {
    }

    public String encode(String[] strs) {
        // One StringBuilder: concatenating Strings in a loop copies the whole prefix every time.
        StringBuilder sb = new StringBuilder();
        for (String s : strs) sb.append(s.length()).append('#').append(s);
        return sb.toString();
    }

    public String[] decode(String s) {
        List<String> out = new ArrayList<>();
        int i = 0;
        while (i < s.length()) {
            // The first '#' after i ends the length; the string itself may contain more of them.
            int j = s.indexOf('#', i);
            int size = Integer.parseInt(s.substring(i, j));
            out.add(s.substring(j + 1, j + 1 + size));
            // Move an index instead of cutting off the decoded prefix.
            i = j + 1 + size;
        }
        return out.toArray(new String[0]);
    }
}
