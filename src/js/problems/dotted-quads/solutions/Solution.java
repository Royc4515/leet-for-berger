import java.util.*;

class Solution {
    // O(1) for bounded input: 3 choices for each of 4 parts. Shorter parts are tried first, and a
    // dot sorts before any digit, so the answers come out in dictionary order.
    public String[] dottedQuads(String s) {
        List<String> out = new ArrayList<>();
        dfs(s, 0, new ArrayList<>(), out);
        return out.toArray(new String[0]);
    }

    private void dfs(String s, int pos, List<String> parts, List<String> out) {
        int left = 4 - parts.size();
        int rest = s.length() - pos;
        // Each remaining part takes 1 to 3 digits; anything else is a dead end.
        if (rest < left || rest > left * 3) return;
        if (left == 0) {
            out.add(String.join(".", parts));
            return;
        }
        for (int len = 1; len <= 3; len++) {
            if (pos + len > s.length()) break;
            String part = s.substring(pos, pos + len);
            // A leading zero is allowed only for the single digit "0".
            if (len > 1 && part.charAt(0) == '0') break;
            if (Integer.parseInt(part) > 255) break;
            parts.add(part);
            dfs(s, pos + len, parts, out);
            parts.remove(parts.size() - 1);
        }
    }
}
