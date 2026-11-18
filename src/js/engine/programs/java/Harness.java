import java.io.*;
import java.lang.reflect.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Runs a Java solution on JSON test cases and prints one JSON result per case, in the case
 * protocol of src/js/engine/programs/output.js (CASE_MARK on stderr before each case, each result
 * on its own line behind RESULT_MARK, flushed per case).
 * Used by tests/solutions.test.js to verify the Java solution every problem ships, and by the
 * remote runner (docs/adr/0005-remote-runner.md), so both run exactly this file.
 *   java Harness <method>  < cases.json   function problems: cases are [[arg1, arg2, ...], ...]
 *   java Harness <Class>   < cases.json   design problems: cases are [[ops, argLists], ...]
 * ListNode and TreeNode arrive as JSON arrays ([1,2,3]; level order with nulls) and leave the same way.
 */
public class Harness {
    // Keep equal to CASE_MARK and RESULT_MARK in output.js (tests/programs.test.js checks it).
    static final String CASE_MARK = "\n\u001e\n";
    static final String RESULT_MARK = "\n\u001e";

    public static void main(String[] argv) throws Exception {
        try {
            run(argv);
        } catch (InvocationTargetException e) {
            // The user's exception, without the reflection frames around it.
            e.getCause().printStackTrace();
            System.exit(1);
        }
    }

    static void beginCase() {
        System.err.print(CASE_MARK);
        System.err.flush();
    }

    // System.out is flushed first so the user's own prints during the case stay before the result.
    static void endCase(PrintStream out, String json) {
        System.out.flush();
        out.print(RESULT_MARK);
        out.print(json);
        out.print('\n');
        out.flush();
    }

    static void run(String[] argv) throws Exception {
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
            beginCase();
            List<?> args = (List<?>) c;
            Object[] converted = convertAll(args, method.getParameterTypes(), method.getGenericParameterTypes());
            // A fresh Solution per case, as on LeetCode: state left in instance fields by one case
            // must not leak into the next (C++ and C# harnesses already do this).
            Object solution = solutionClass.getDeclaredConstructor().newInstance();
            endCase(out, toJson(method.invoke(solution, converted), method.getReturnType()));
        }
    }

    // Design problems: construct with ops[0]'s arguments, then call each method by name.
    static void runClass(String className, List<?> cases) throws Exception {
        Class<?> cls = Class.forName(className);
        Map<String, Method> methods = new HashMap<>();
        PrintStream out = new PrintStream(new BufferedOutputStream(System.out), false, StandardCharsets.UTF_8);
        for (Object c : cases) {
            beginCase();
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
                    obj = ctor.newInstance(convertAll(a, ctor.getParameterTypes(), ctor.getGenericParameterTypes()));
                    sb.append("null");
                    continue;
                }
                // Looked up once per name and arity: reflection lookups per call dominated 10^5-call cases.
                String name = (String) ops.get(i);
                int arity = a.size();
                Method m = methods.computeIfAbsent(name + "/" + arity, key -> {
                    Method found = null;
                    for (Method k : cls.getDeclaredMethods()) if (k.getName().equals(name) && k.getParameterCount() == arity) found = k;
                    if (found != null) found.setAccessible(true);
                    return found;
                });
                if (m == null) throw new IllegalStateException("No method " + ops.get(i));
                Object r = m.invoke(obj, convertAll(a, m.getParameterTypes(), m.getGenericParameterTypes()));
                sb.append(m.getReturnType() == void.class ? "null" : toJson(r, m.getReturnType()));
            }
            endCase(out, sb.append(']').toString());
        }
    }

    static Object[] convertAll(List<?> args, Class<?>[] types, Type[] generics) {
        Object[] out = new Object[types.length];
        for (int i = 0; i < types.length; i++) {
            // List<NestedInteger> is the one parameter whose element type only the generic signature knows.
            boolean nested = generics[i] instanceof ParameterizedType p && p.getActualTypeArguments()[0] == NestedInteger.class;
            out[i] = nested ? toNested((List<?>) args.get(i)) : convert(args.get(i), types[i]);
        }
        return out;
    }

    static List<NestedInteger> toNested(List<?> a) {
        List<NestedInteger> out = new ArrayList<>();
        for (Object x : a) out.add(x instanceof List<?> l ? new NestedIntegerImpl(toNested(l)) : new NestedIntegerImpl(((Number) x).intValue()));
        return out;
    }

    // Input nodes of the current RandomListNode case, by identity, so a returned original is caught.
    static final Set<RandomListNode> GIVEN = Collections.newSetFromMap(new IdentityHashMap<>());
    // Same strings as COPY_MARKERS in src/js/engine/adapters.js.
    static final String SHARED_NODE = "not a copy: the returned list reuses input nodes";
    static final String OUTSIDE_RANDOM = "not a copy: a random pointer leaves the returned list";

    // Maps parsed JSON (Long, Double, String, Boolean, List) onto the declared Java parameter type.
    static Object convert(Object v, Class<?> t) {
        // ListNode@cycle arrives as [values, pos]: a plain list's items are numbers, never a list.
        if (t == ListNode.class && !((List<?>) v).isEmpty() && ((List<?>) v).get(0) instanceof List<?> values) {
            int pos = ((Number) ((List<?>) v).get(1)).intValue();
            List<ListNode> nodes = new ArrayList<>();
            for (Object x : values) nodes.add(new ListNode(((Number) x).intValue()));
            for (int i = 0; i + 1 < nodes.size(); i++) nodes.get(i).next = nodes.get(i + 1);
            if (pos >= 0 && !nodes.isEmpty()) nodes.get(nodes.size() - 1).next = nodes.get(pos);
            return nodes.isEmpty() ? null : nodes.get(0);
        }
        if (t == RandomListNode.class) {
            List<?> pairs = (List<?>) v;
            List<RandomListNode> nodes = new ArrayList<>();
            for (Object p : pairs) nodes.add(new RandomListNode(((Number) ((List<?>) p).get(0)).intValue()));
            GIVEN.clear();
            for (int i = 0; i < nodes.size(); i++) {
                Object r = ((List<?>) pairs.get(i)).get(1);
                nodes.get(i).next = i + 1 < nodes.size() ? nodes.get(i + 1) : null;
                nodes.get(i).random = r == null ? null : nodes.get(((Number) r).intValue());
                GIVEN.add(nodes.get(i));
            }
            return nodes.isEmpty() ? null : nodes.get(0);
        }
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
        if (v == null && (declared == ListNode.class || declared == TreeNode.class || declared == RandomListNode.class)) return "[]";
        return toJson(v);
    }

    // [[val, randomIndex|null], ...], or a marker string when the result is not a real copy.
    static String randomListJson(RandomListNode head) {
        Map<RandomListNode, Integer> index = new IdentityHashMap<>();
        List<RandomListNode> order = new ArrayList<>();
        for (RandomListNode n = head; n != null; n = n.next) {
            if (GIVEN.contains(n)) return quote(SHARED_NODE);
            if (index.containsKey(n)) throw new IllegalStateException("Returned list has a cycle");
            index.put(n, order.size());
            order.add(n);
        }
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < order.size(); i++) {
            RandomListNode r = order.get(i).random;
            if (r != null && GIVEN.contains(r)) return quote(SHARED_NODE);
            if (r != null && !index.containsKey(r)) return quote(OUTSIDE_RANDOM);
            sb.append(i > 0 ? "," : "").append('[').append(order.get(i).val).append(',').append(r == null ? "null" : String.valueOf(index.get(r))).append(']');
        }
        return sb.append(']').toString();
    }

    static String toJson(Object v) {
        if (v instanceof RandomListNode rn) return randomListJson(rn);
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
            // Not String.matches: it compiles a regex per number, a third of the run on 10^5-call cases.
            boolean integral = num.indexOf('.') < 0 && num.indexOf('e') < 0 && num.indexOf('E') < 0;
            return integral ? (Object) Long.parseLong(num) : (Object) Double.parseDouble(num);
        }

        private void skip() { while (i < s.length() && Character.isWhitespace(s.charAt(i))) i++; }
    }
}
