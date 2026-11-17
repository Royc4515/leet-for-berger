import java.io.*;
import java.lang.reflect.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Runs Solution.<entry> on JSON test cases and prints one JSON result per line.
 * Used by tests/solutions.test.js to verify the Java solution every problem ships.
 * Usage: java Harness <entry> < cases.json   (cases.json: [[arg1, arg2, ...], ...])
 */
public class Harness {
    public static void main(String[] argv) throws Exception {
        String entry = argv[0];
        String input = new String(System.in.readAllBytes(), StandardCharsets.UTF_8);
        List<?> cases = (List<?>) new Json(input).parse();
        Object solution = Class.forName("Solution").getDeclaredConstructor().newInstance();
        Method method = null;
        for (Method m : solution.getClass().getDeclaredMethods()) if (m.getName().equals(entry)) method = m;
        if (method == null) throw new IllegalStateException("No method " + entry);
        method.setAccessible(true);
        PrintStream out = new PrintStream(new BufferedOutputStream(System.out), false, StandardCharsets.UTF_8);
        for (Object c : cases) {
            List<?> args = (List<?>) c;
            Class<?>[] types = method.getParameterTypes();
            Object[] converted = new Object[types.length];
            for (int i = 0; i < types.length; i++) converted[i] = convert(args.get(i), types[i]);
            out.println(toJson(method.invoke(solution, converted)));
        }
        out.flush();
    }

    // Maps parsed JSON (Long, Double, String, Boolean, List) onto the declared Java parameter type.
    static Object convert(Object v, Class<?> t) {
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

    static String toJson(Object v) {
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
