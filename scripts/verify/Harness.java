import java.io.*;
import java.lang.reflect.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Runs a Java solution on JSON test cases and prints one JSON result per line.
 * Used by tests/solutions.test.js to verify the Java solution every problem ships.
 *   java Harness <method>  < cases.json   function problems: cases are [[arg1, arg2, ...], ...]
 *   java Harness <Class>   < cases.json   design problems: cases are [[ops, argLists], ...]
 * ListNode and TreeNode arrive as JSON arrays ([1,2,3]; level order with nulls) and leave the same way.
 */
public class Harness {
    public static void main(String[] argv) throws Exception {
        String entry = argv[0];
        String input = new String(System.in.readAllBytes(), StandardCharsets.UTF_8);
        List<?> cases = (List<?>) new Json(input).parse();
        if (Character.isUpperCase(entry.charAt(0))) {
            runClass(entry, cases);
            return;
        }
        Class<?> solutionClass = Class.forName("Solution");
        Method method = null;
        for (Method m : solutionClass.getDeclaredMethods()) if (m.getName().equals(entry)) method = m;
        if (method == null) throw new IllegalStateException("No method " + entry);
        method.setAccessible(true);
        PrintStream out = new PrintStream(new BufferedOutputStream(System.out), false, StandardCharsets.UTF_8);
        for (Object c : cases) {
            List<?> args = (List<?>) c;
            Class<?>[] types = method.getParameterTypes();
            Object[] converted = new Object[types.length];
            for (int i = 0; i < types.length; i++) converted[i] = convert(args.get(i), types[i]);
            // A fresh Solution per case, as on LeetCode: state left in instance fields by one case
            // must not leak into the next (C++ and C# harnesses already do this).
            Object solution = solutionClass.getDeclaredConstructor().newInstance();
            out.println(toJson(method.invoke(solution, converted), method.getReturnType()));
        }
        out.flush();
    }

    // Design problems: construct with ops[0]'s arguments, then call each method by name.
    static void runClass(String className, List<?> cases) throws Exception {
        Class<?> cls = Class.forName(className);
        PrintStream out = new PrintStream(new BufferedOutputStream(System.out), false, StandardCharsets.UTF_8);
        for (Object c : cases) {
            List<?> ops = (List<?>) ((List<?>) c).get(0);
            List<?> args = (List<?>) ((List<?>) c).get(1);
            StringBuilder sb = new StringBuilder("[");
            Object obj = null;
            for (int i = 0; i < ops.size(); i++) {
                List<?> a = (List<?>) args.get(i);
                if (i > 0) sb.append(',');
                if (i == 0) {
                    Constructor<?> ctor = null;
                    for (Constructor<?> k : cls.getDeclaredConstructors()) if (k.getParameterCount() == a.size()) ctor = k;
                    if (ctor == null) throw new IllegalStateException("No constructor with " + a.size() + " params");
                    ctor.setAccessible(true);
                    obj = ctor.newInstance(convertAll(a, ctor.getParameterTypes()));
                    sb.append("null");
                    continue;
                }
                Method m = null;
                for (Method k : cls.getDeclaredMethods()) if (k.getName().equals(ops.get(i)) && k.getParameterCount() == a.size()) m = k;
                if (m == null) throw new IllegalStateException("No method " + ops.get(i));
                m.setAccessible(true);
                Object r = m.invoke(obj, convertAll(a, m.getParameterTypes()));
                sb.append(m.getReturnType() == void.class ? "null" : toJson(r, m.getReturnType()));
            }
            out.println(sb.append(']'));
        }
        out.flush();
    }

    static Object[] convertAll(List<?> args, Class<?>[] types) {
        Object[] out = new Object[types.length];
        for (int i = 0; i < types.length; i++) out[i] = convert(args.get(i), types[i]);
        return out;
    }

    // Maps parsed JSON (Long, Double, String, Boolean, List) onto the declared Java parameter type.
    static Object convert(Object v, Class<?> t) {
        if (t == ListNode.class) {
            ListNode d = new ListNode(), n = d;
            for (Object x : (List<?>) v) { n.next = new ListNode(((Number) x).intValue()); n = n.next; }
            return d.next;
        }
        if (t == TreeNode.class) {
            List<?> a = (List<?>) v;
            if (a.isEmpty() || a.get(0) == null) return null;
            TreeNode root = new TreeNode(((Number) a.get(0)).intValue());
            Deque<TreeNode> q = new ArrayDeque<>(List.of(root));
            int k = 1;
            while (!q.isEmpty() && k < a.size()) {
                TreeNode x = q.poll();
                if (k < a.size()) { Object l = a.get(k++); if (l != null) { x.left = new TreeNode(((Number) l).intValue()); q.add(x.left); } }
                if (k < a.size()) { Object r = a.get(k++); if (r != null) { x.right = new TreeNode(((Number) r).intValue()); q.add(x.right); } }
            }
            return root;
        }
        if (t == int.class || t == Integer.class) return ((Number) v).intValue();
        if (t == long.class || t == Long.class) return ((Number) v).longValue();
        if (t == double.class || t == Double.class) return ((Number) v).doubleValue();
        if (t == boolean.class || t == Boolean.class) return v;
        if (t == String.class) return v;
        if (t == char.class) return ((String) v).charAt(0);
        if (t.isArray()) {
            List<?> list = (List<?>) v;
            Class<?> ct = t.getComponentType();
            Object arr = Array.newInstance(ct, list.size());
            for (int i = 0; i < list.size(); i++) Array.set(arr, i, convert(list.get(i), ct));
            return arr;
        }
        if (List.class.isAssignableFrom(t)) return v;
        throw new IllegalArgumentException("Unsupported parameter type " + t);
    }

    // A null list or tree is the empty structure, written []; the declared type tells them apart.
    static String toJson(Object v, Class<?> declared) {
        if (v == null && (declared == ListNode.class || declared == TreeNode.class)) return "[]";
        return toJson(v);
    }

    static String toJson(Object v) {
        if (v instanceof ListNode ln) {
            StringBuilder sb = new StringBuilder("[");
            for (ListNode n = ln; n != null; n = n.next) sb.append(n == ln ? "" : ",").append(n.val);
            return sb.append(']').toString();
        }
        if (v instanceof TreeNode tn) {
            List<String> out = new ArrayList<>();
            List<TreeNode> q = new ArrayList<>(List.of(tn));
            for (int h = 0; h < q.size(); h++) {
                TreeNode x = q.get(h);
                if (x == null) { out.add("null"); continue; }
                out.add(String.valueOf(x.val));
                q.add(x.left);
                q.add(x.right);
            }
            while (!out.isEmpty() && out.get(out.size() - 1).equals("null")) out.remove(out.size() - 1);
            return "[" + String.join(",", out) + "]";
        }
        if (v == null) return "null";
        if (v instanceof String s) return quote(s);
        if (v instanceof Character ch) return quote(String.valueOf(ch));
        if (v instanceof Number || v instanceof Boolean) return String.valueOf(v);
        StringBuilder sb = new StringBuilder("[");
        if (v.getClass().isArray()) {
            for (int i = 0; i < Array.getLength(v); i++) sb.append(i > 0 ? "," : "").append(toJson(Array.get(v, i)));
        } else if (v instanceof Iterable<?> it) {
            boolean first = true;
            for (Object o : it) { sb.append(first ? "" : ",").append(toJson(o)); first = false; }
        } else {
            throw new IllegalArgumentException("Unsupported return type " + v.getClass());
        }
        return sb.append("]").toString();
    }

    static String quote(String s) {
        StringBuilder sb = new StringBuilder("\"");
        for (char c : s.toCharArray()) {
            if (c == '"' || c == '\\') sb.append('\\').append(c);
            else if (c < 0x20) sb.append(String.format("\\u%04x", (int) c));
            else sb.append(c);
        }
        return sb.append('"').toString();
    }

    /** Minimal JSON reader: enough for test arguments (no objects needed). */
    static final class Json {
        private final String s;
        private int i;
        Json(String s) { this.s = s; }

        Object parse() {
            skip();
            char c = s.charAt(i);
            if (c == '[') {
                i++;
                List<Object> list = new ArrayList<>();
                skip();
                if (s.charAt(i) == ']') { i++; return list; }
                while (true) {
                    list.add(parse());
                    skip();
                    if (s.charAt(i++) == ']') return list;
                }
            }
            if (c == '"') {
                StringBuilder sb = new StringBuilder();
                i++;
                while (s.charAt(i) != '"') {
                    char ch = s.charAt(i++);
                    if (ch == '\\') {
                        char e = s.charAt(i++);
                        switch (e) {
                            case 'n' -> sb.append('\n');
                            case 't' -> sb.append('\t');
                            case 'u' -> { sb.append((char) Integer.parseInt(s.substring(i, i + 4), 16)); i += 4; }
                            default -> sb.append(e);
                        }
                    } else sb.append(ch);
                }
                i++;
                return sb.toString();
            }
            if (s.startsWith("true", i)) { i += 4; return true; }
            if (s.startsWith("false", i)) { i += 5; return false; }
            if (s.startsWith("null", i)) { i += 4; return null; }
            int start = i;
            while (i < s.length() && "+-0123456789.eE".indexOf(s.charAt(i)) >= 0) i++;
            String num = s.substring(start, i);
            return num.matches("-?\\d+") ? (Object) Long.parseLong(num) : (Object) Double.parseDouble(num);
        }

        private void skip() { while (i < s.length() && Character.isWhitespace(s.charAt(i))) i++; }
    }
}
