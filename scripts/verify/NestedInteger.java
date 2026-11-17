import java.util.*;

// Provided to Java solutions by the verifier: LeetCode's interface, as shown in starter code.
public interface NestedInteger {
    boolean isInteger();
    Integer getInteger();
    List<NestedInteger> getList();
}

// The harness builds inputs with this; solutions only see the interface.
class NestedIntegerImpl implements NestedInteger {
    private final Integer value;
    private final List<NestedInteger> list;

    NestedIntegerImpl(int value) { this.value = value; this.list = new ArrayList<>(); }
    NestedIntegerImpl(List<NestedInteger> list) { this.value = null; this.list = list; }

    public boolean isInteger() { return value != null; }
    public Integer getInteger() { return value; }
    public List<NestedInteger> getList() { return list; }
}
