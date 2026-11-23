# Quiz bank research: OOP, SOLID and clean code, design patterns, Java, C#, Python, JavaScript/TypeScript

Audience: first-job (junior / new grad) and student software positions, with Israel in mind (Intel, Nvidia, Microsoft, Wix, Check Point, Amdocs, NICE, Elbit).
Goal: map the concepts interviewers probe so we can write our own understanding-based multiple-choice questions. Nothing here is copied question text.

## Method and evidence summary

- About 20 sources: interview-prep sites (GeeksforGeeks, InterviewBit, Javarevisited, Indeed, DataCamp), Glassdoor reports (Intel student, Wix student, Elbit), Israeli sources (theworker.co.il student reports for NICE, tech-interview.co.il, CodeGym Hebrew), GitHub question lists (GreatFrontEnd, sudheerj, Lydia Hallie, Tech Interview Handbook, iluwatar patterns), Reddit threads (search snippets only; Reddit pages could not be fetched directly).
- Limit: the Firecrawl credit allowance ran out mid-research, and Reddit and some Glassdoor pages block fetching. The Reddit and Glassdoor evidence is therefore from search snippets and page summaries, not full threads. Weights below combine that evidence with how often a concept appears across independent lists.
- Signal from Israeli student reports: the NICE student reports on theworker.co.il list polymorphism (x3), abstract classes (x2), inheritance (x2), parent/child classes (x2), OOP (x2), Java (x4), Python (x2), design patterns, UML, a generic interface in Java, and "design a car rental system / implement a clock object". The Intel student reports on Glassdoor are mostly C/C++, low level (registers, asm), and data structures, with "OOP concept" appearing in Intel GPU-SW reports. Elbit reports say "core CS concepts, OOP principles, basic data structures". Wix student/frontend reports keep mentioning JS closures, hoisting, debounce, currying and "guess the output" snippets.
- Conclusion: OOP fundamentals are the most consistently asked non-algorithm knowledge topic for Israeli student roles. Language depth is asked for **the language on the candidate's CV** (often Java, Python, C++; JS at Wix/web companies). Design patterns show up as "name one and explain when to use it", rarely deeper.

Cross-group note: C++ is not in this group, but it is the dominant language at Intel, Nvidia, Check Point and embedded/defence employers. Its OOP side (virtual functions, vtable, virtual destructor, object slicing, rule of three, const) overlaps heavily with "OOP fundamentals" below. Make sure the C/C++ group covers it, or add a C++-flavoured slice to OOP.

---

## 1. OOP fundamentals

**Weight: HIGH.** The single most repeated knowledge topic in student and junior reports (NICE, Elbit, Intel "OOP concepts", every prep list). Interviewers use it to check whether a candidate can reason about design, not just syntax.

### Concept map

1. **Class vs object vs instance**
   - A class is a blueprint and an object is a runtime instance with its own state. Instance fields are per-object; static fields are per-class.
   - What is shared when you create two objects: methods (code) yes, instance fields no, static fields yes.
2. **Encapsulation**
   - Why hide fields: protect invariants (a balance cannot go negative), keep the freedom to change the representation later, limit who can break state.
   - Getters/setters that expose every field are not encapsulation in a meaningful sense. A setter that validates is.
   - Encapsulation vs data hiding vs abstraction: encapsulation bundles state with behaviour and controls access; abstraction exposes "what", hides "how".
3. **Abstraction**
   - Abstraction is about the interface the caller depends on. Abstract classes and interfaces are tools for it, not the definition of it.
   - Benefit: callers do not change when the implementation changes.
4. **Inheritance**
   - IS-A relationship. A subclass inherits behaviour and can extend or override it.
   - Constructor chaining: the base part is constructed first; the subclass constructor runs after the base constructor.
   - What is not inherited or not overridable: constructors, private members (not visible), static methods (hidden, not overridden).
   - Fragile base class problem: changes in a base class can silently break subclasses.
   - Why many languages ban multiple inheritance of classes (diamond problem: two inherited implementations of the same method; which one wins?), and how interfaces/default methods, mixins or MRO address it.
5. **Polymorphism**
   - Runtime (dynamic dispatch, overriding): the method chosen depends on the object's actual type, not the declared reference type.
   - Compile-time (overloading): chosen from the declared (static) types of the arguments.
   - Key reasoning: given `Base b = new Derived(); b.f();`, which `f` runs? And with overloads `g(Base)` / `g(Derived)` called with `b`, which runs? (Overload picks `g(Base)` from the static type.)
   - Fields are not polymorphic (in Java, field access uses the static type).
   - Why polymorphism removes `if (type == ...)` / switch-on-type chains.
6. **Overloading vs overriding**
   - Resolution time (compile vs run), signature rules (same signature + compatible return for override; different parameter list for overload; return type alone cannot overload).
   - Overriding cannot reduce visibility; overriding cannot throw broader checked exceptions (Java).
   - Static methods are hidden, not overridden: the call is resolved by the reference type.
7. **Abstract class vs interface**
   - Abstract class: can hold state and constructors, partial implementation, single inheritance. Interface: a contract, multiple implementation, (in modern Java/C#) default methods but no instance state.
   - "Which fits here" scenarios: shared code and state among closely related types -> abstract class; capability that unrelated classes share (Comparable, Serializable, Drawable) -> interface.
   - Can you instantiate an abstract class? No, but you can have a reference of its type pointing to a concrete subclass.
   - Adding a method to a widely implemented interface breaks every implementer, which is why default methods exist.
8. **Composition vs inheritance (HAS-A vs IS-A)**
   - "Favour composition over inheritance": looser coupling, behaviour can change at runtime, avoids deep fragile hierarchies.
   - Association vs aggregation vs composition: lifetime ownership (composition: the part dies with the whole).
   - Classic case: Stack extending a list type exposes operations that break stack semantics.
9. **Access modifiers and visibility**
   - private / protected / public (and package-private in Java, internal in C#). Which one to pick for a field, a helper method, a hook meant for subclasses.
   - Protected leaks implementation details to all subclasses, so it is a weaker encapsulation than private.
10. **Static vs instance members**
    - Static methods cannot use `this` / instance fields. Static state is shared and is a source of hidden coupling and test pain.
11. **Constructors and object lifecycle**
    - Default constructor disappears once you declare any constructor (Java/C#/C++).
    - Calling an overridable method from a constructor is dangerous: the subclass override runs before the subclass fields are initialised.
    - Destructors / finalizers / garbage collection at a conceptual level: who frees memory and when.
12. **Coupling and cohesion**
    - High cohesion (a class does one coherent job), low coupling (few, narrow dependencies). Why both make code easier to change and test.
13. **Programming to an interface**
    - Declaring `List<X> items = new ArrayList<>()` rather than `ArrayList<X>`: the caller can swap implementations.
14. **Object identity vs equality**
    - Reference equality vs value equality (Java `==` vs `equals`, Python `is` vs `==`, JS `===` on objects). Cross-language idea worth one question family.
15. **Modelling small systems (OOD-lite)**
    - "Design a parking lot / car rental / clock / vending machine": picking classes, responsibilities, which relationship (inheritance vs composition vs enum), where state lives. For MCQ, use "which design is better and why" with 3-4 candidate class diagrams in text.

### Classic traps and good distractors

- "Polymorphism means a method with many names" / confusing overloading with overriding.
- Believing the declared type decides which overridden method runs.
- Believing overloads are resolved at runtime by the object's actual type.
- Believing static methods can be overridden (they are hidden).
- "Encapsulation = making all fields private and adding getters and setters for all of them."
- "Abstraction and encapsulation are the same thing."
- "An abstract class must have at least one abstract method" (not required in Java/C#).
- "Interfaces cannot have any method bodies" (outdated for Java 8+ and C# 8+).
- "Inheritance is the main way to reuse code" (composition is usually preferred).
- "Private members are inherited and accessible in the subclass."
- "A subclass constructor runs before the base constructor."
- Choosing inheritance for a HAS-A relationship (Car extends Engine).

### Exclude (trivia or too senior)

- History (Simula, Smalltalk, who coined the term), lists of "OOP languages".
- Vtable memory layout details beyond "dynamic dispatch uses a per-class table" (keep one conceptual C++ question at most).
- Formal type theory (covariance/contravariance proofs), metaclasses, multiple-dispatch theory.
- UML notation details (arrowhead shapes). Keep "which relationship is this" in words instead.

---

## 2. SOLID and clean code

**Weight: MEDIUM.** Asked often enough to matter (Javarevisited, GfG, Indeed, Reddit threads where interviewers expect juniors to explain the acronym), but juniors are rarely grilled past one or two principles. Best tested with "which principle does this code violate" scenarios, which is exactly what MCQ is good at.

### Concept map

1. **Single Responsibility (SRP)**
   - "One reason to change", not "one method". A class that parses, validates and saves to DB has three reasons to change.
   - Symptom: a change in report format forces editing the class that does DB access.
2. **Open/Closed (OCP)**
   - Add behaviour by adding code (new subclass/strategy), not by editing a growing `switch` on type.
   - Link to polymorphism and strategy pattern.
3. **Liskov Substitution (LSP)**
   - A subtype must be usable wherever the base type is expected without surprising the caller: no stronger preconditions, no weaker postconditions, no new exceptions for normal calls.
   - Classic examples: Square extends Rectangle (setWidth breaks the area expectation), Penguin extends Bird with `fly()` throwing.
   - Fix: rethink the hierarchy (separate interfaces, composition), not add `instanceof` checks.
4. **Interface Segregation (ISP)**
   - Clients should not depend on methods they do not use. A fat `Machine` interface with print/scan/fax forces a simple printer to stub methods.
5. **Dependency Inversion (DIP)**
   - High-level policy depends on abstractions, not concrete low-level classes. Relationship with dependency injection (DI is a technique to achieve DIP) and testability (inject a fake).
   - DIP vs DI vs IoC: related, not identical.
6. **DRY, KISS, YAGNI**
   - DRY is about duplicated knowledge, not duplicated characters; premature DRY can couple unrelated code.
   - YAGNI vs over-engineering with patterns.
7. **Naming, function size, side effects**
   - Intention-revealing names, small functions doing one thing, avoid hidden side effects, command-query separation.
8. **Magic numbers, boolean flag parameters, deep nesting**
   - Why `process(data, true, false)` is hard to read; guard clauses vs nested ifs.
9. **Coupling, cohesion, Law of Demeter**
   - `a.getB().getC().doX()` couples you to the structure of B and C.
10. **Testability as a design signal**
    - Code hard to unit-test usually has hidden dependencies (static calls, `new` inside methods, global state).
11. **Code smells and refactoring (light)**
    - Long method, large class, duplicated code, feature envy, switch on type. What refactoring means (behaviour-preserving change, protected by tests).

### Traps and distractors

- SRP = "a class should have only one method".
- OCP = "never modify existing code, ever" (bug fixes are fine).
- LSP = "a subclass can be assigned to a base reference" (that is just subtyping; LSP is about behaviour).
- DIP = "dependency injection" (DI is one way to do it).
- ISP confused with SRP (ISP is about the client's view of an interface).
- "DRY means never write two similar lines."
- Picking "add an `instanceof` check" as the fix for an LSP violation.

### Exclude

- Who coined SOLID and when, book titles and authors as answers.
- Package-level principles (REP, CCP, CRP, ADP, SDP, SAP), Clean Architecture layers, hexagonal/onion, DDD aggregates: too senior.
- Debates on exact function length limits.

---

## 3. Design patterns

**Weight: MEDIUM-LOW** for juniors overall; MEDIUM for Java/C# shops and Israeli enterprise companies (NICE reports mention "design patterns"; GfG and Javarevisited lists focus on a small set). Juniors are expected to name and explain a few, recognise them in code, and say when not to use them. Full GoF catalogue knowledge is not expected.

### Which patterns juniors are actually asked about (by frequency across sources)

- Tier 1 (ask): **Singleton, Factory (Factory Method / simple factory), Strategy, Observer**.
- Tier 2 (occasionally): **Builder, Adapter, Decorator, Iterator**, and **Dependency Injection** as a concept.
- Tier 3 (rare for juniors, appears in senior/LLD rounds): State, Command, Template Method, Proxy, Facade, Composite, Abstract Factory, Chain of Responsibility.
- Recurring comparison questions: Strategy vs State, Factory vs Abstract Factory, Decorator vs Proxy vs inheritance, DI vs Factory.

### Concept map

1. **What a pattern is and why**
   - A named, reusable solution to a recurring design problem, giving a shared vocabulary. Not a library, not an algorithm.
   - Three families: creational (how objects are made), structural (how objects are composed), behavioural (how objects interact). Classifying a pattern is fair; memorising full lists is not.
2. **Singleton**
   - Purpose: exactly one instance with a global access point (config, logger, connection pool).
   - Mechanics conceptually: private constructor + static accessor; lazy vs eager creation.
   - Thread-safety issue with naive lazy init (two threads both see null).
   - Downsides: hidden global state, hard to test/mock, tight coupling. Often an anti-pattern; DI of a single instance is preferred.
3. **Factory**
   - Hide which concrete class is created; the caller asks for "a shape for this input". Decouples creation from use; centralises `new`.
   - When useful: the concrete type depends on runtime data (file extension, config).
4. **Strategy**
   - Encapsulate interchangeable algorithms behind one interface and choose at runtime (payment method, sort comparator, pricing rule).
   - Replaces conditionals; supports OCP; in modern languages a lambda/function is often the strategy.
5. **Observer (publish/subscribe)**
   - Subject notifies registered listeners on change; loose coupling between producer and consumers. Real-world: UI event listeners, DOM `addEventListener`, reactive streams.
   - Pitfalls: forgetting to unsubscribe (memory leaks), notification order assumptions.
6. **Builder**
   - Construct objects with many optional parameters readably; avoids telescoping constructors; can produce immutable objects.
7. **Adapter**
   - Make an existing class fit an expected interface without changing it (wrap a third-party API).
8. **Decorator**
   - Add behaviour by wrapping an object with the same interface, stacking at runtime, instead of a subclass per combination (Java I/O streams, Python decorators as a related idea).
9. **Iterator**
   - Traverse a collection without exposing its internal structure; basis of for-each loops in Java/Python/JS.
10. **Dependency Injection (as pattern/concept)**
    - Pass dependencies in (constructor) rather than constructing them inside. Benefits: testing with fakes, swapping implementations.
11. **Strategy vs State** (stretch)
    - Same structure; Strategy is chosen by the client, State changes itself as the object's internal state changes.
12. **When not to use a pattern**
    - Over-engineering, pattern for its own sake, YAGNI.

### Traps and distractors

- "Singleton guarantees thread safety automatically."
- "Singleton is the best way to share data between classes."
- "Factory and Builder are the same" (Builder is about step-by-step construction of one complex object; Factory is about choosing which type).
- "Decorator = inheritance" or "Adapter adds new behaviour" (Adapter converts interfaces).
- Mixing up Observer with Strategy because both use an interface.
- Misclassifying: Singleton as structural, Observer as creational.
- "Design patterns are language features / libraries."

### Exclude

- Memorising all 23 GoF names or their book category lists.
- Double-checked locking with `volatile` details, enum-singleton serialization corner cases, reflection attacks on singletons: too deep.
- Visitor, Flyweight, Memento, Interpreter, Bridge, Mediator for this audience.
- Enterprise/architectural patterns (CQRS, event sourcing, saga, microservice patterns).

---

## 4. Java

**Weight: HIGH where Java is the candidate's language** (very common in Israeli CS degrees and at Amdocs, NICE, enterprise and backend teams; NICE reports mention Java 4 times). As a general bank: MEDIUM-HIGH. Questions focus on the object model, collections and memory semantics rather than API names.

### Concept map

1. **Pass-by-value semantics**
   - Java is always pass-by-value; for objects, the value is the reference. Reassigning a parameter does not affect the caller; mutating the object does.
   - Typical item: a method that sets `param = new X()` vs one that calls `param.setY()`.
2. **`==` vs `equals`**
   - Reference identity vs logical equality; default `equals` is identity. String comparison with `==` sometimes "works" because of interning, which is exactly why it is a bug.
3. **`equals` / `hashCode` contract**
   - Equal objects must have equal hash codes; not vice versa (collisions are allowed).
   - Overriding `equals` without `hashCode` breaks HashMap/HashSet: two equal keys land in different buckets, so lookups fail and duplicates appear.
   - Mutating a field used in `hashCode` after inserting into a HashSet/HashMap "loses" the entry.
   - Why keys should be immutable (String, Integer).
4. **String immutability and the string pool**
   - Why immutable: safe sharing, caching of hash, security (paths, class names), thread safety, enables the pool.
   - Concatenation in a loop creates many objects; StringBuilder is the fix (conceptual cost, not micro-benchmarks).
   - `new String("a") == "a"` is false; literals are pooled.
5. **Primitives vs wrappers, autoboxing**
   - `int` vs `Integer`, null unboxing throws NullPointerException, `Integer` comparison with `==` works only for small cached values (concept: identity vs value; avoid testing the exact cache range).
   - Generics need reference types (`List<int>` is not allowed).
6. **Collections: choosing the right one**
   - ArrayList vs LinkedList (random access vs insert in the middle; in practice ArrayList usually wins), HashMap vs TreeMap vs LinkedHashMap (order guarantees, O(1) vs O(log n)), HashSet vs TreeSet, Queue/Deque, PriorityQueue.
   - List vs Set vs Map semantics (duplicates, ordering).
7. **HashMap internals (conceptual)**
   - Hash -> bucket index, collisions handled by chaining (list, then tree for big buckets), resizing when load factor exceeded, average O(1) and worst case.
   - Null keys allowed in HashMap, not in Hashtable/ConcurrentHashMap (one optional item).
8. **Exceptions**
   - Checked vs unchecked (compile-time forced handling vs programming errors), Error vs Exception.
   - `finally` runs even after `return` (except in a process exit); return in finally overrides.
   - try-with-resources and AutoCloseable: why it beats manual close in finally.
   - Catch order: specific before general (unreachable catch is a compile error).
9. **`final`, `static`, `abstract`**
   - `final` variable (reference cannot be reassigned, object can still mutate), `final` method (cannot override), `final` class (cannot extend).
   - `final` vs `finally` vs `finalize` (finalize deprecated; ask conceptually only).
   - `static` members belong to the class; static nested vs inner class captures outer instance.
10. **Interfaces and abstract classes in Java specifically**
    - Default and static interface methods; a class implementing two interfaces with the same default must override.
    - Why Java has single class inheritance but multiple interface implementation.
11. **Memory model at a junior level**
    - Stack (frames, local variables, references) vs heap (objects). Garbage collection reclaims unreachable objects; cycles are fine.
    - Memory leaks still happen in Java (static collections, listeners never removed).
12. **Generics**
    - Type safety at compile time; type erasure means no `new T()` and no `instanceof List<String>` (concept only).
    - `List<Object>` is not a supertype of `List<String>`; `? extends` for reading (one stretch item).
13. **Immutability and `record`/value objects**
    - How to make a class immutable: final fields, no setters, defensive copies of mutable inputs.
14. **Concurrency basics (light)**
    - Thread vs process, race condition on `count++`, `synchronized` gives mutual exclusion, why `HashMap` is not thread-safe.
    - (Overlaps with the OS/concurrency group; keep a few Java-flavoured items.)
15. **Lambdas and streams (light)**
    - Functional interfaces, lazy intermediate vs terminal operations, effectively-final capture.
16. **Comparable vs Comparator**
    - Natural order inside the class vs external strategy (links to Strategy pattern); consistency with equals.

### Traps and distractors

- "Java passes objects by reference."
- "If two objects have the same hashCode they are equal."
- "Overriding equals is enough for HashSet."
- "`final` makes the object immutable."
- "`finally` does not run if the try block returns."
- "String concatenation modifies the original string."
- "Garbage collection prevents all memory leaks."
- "Static methods can be overridden."
- "LinkedList is always faster for insertions" (only with an iterator at the position; finding the position is O(n)).
- "HashMap keeps insertion order."
- "Checked exceptions are the ones checked at runtime."

### Exclude

- JVM flags, GC algorithm names (G1, ZGC) and tuning, class loader hierarchy, bytecode instructions, JIT internals.
- Exact Integer cache range, exact default capacity / load factor numbers, treeify threshold numbers.
- Java version numbers for features, Java EE/Spring/Hibernate specifics, annotations processing, reflection, serialization UID details, `volatile`/happens-before formalism, `java.util.concurrent` class catalogue.

---

## 5. C# (short note)

**Weight: LOW as a dedicated topic.** C# appears in Israeli job postings (defence, Microsoft, some enterprise and game shops), but student and junior interviews rarely test C# specifically; they test OOP concepts, and C# candidates answer in C#. The concepts that are genuinely C#-distinctive and worth a handful of questions:

- Value types (struct) vs reference types (class): copying a struct copies data; copying a class copies a reference. Stack vs heap as the usual (simplified) mental model.
- Boxing/unboxing: value type converted to object; hidden cost; why generics avoid it.
- `ref`/`out` vs default pass-by-value of references.
- Properties vs fields (encapsulation in C# style).
- `virtual`/`override`/`new` (method hiding vs overriding) - a good polymorphism trap: `new` hides, so the base-typed reference calls the base method.
- `IDisposable` and `using` for deterministic cleanup (parallel to Java try-with-resources).
- LINQ deferred execution (light).
- async/await is not "new thread" (shared idea with JS).

Recommendation: no separate C# topic. Put 4-8 C# items inside OOP fundamentals (value vs reference, virtual/override/new) and maybe tag them "C#". Exclude .NET runtime versions, CLR internals, ASP.NET, Entity Framework, attribute catalogues.

---

## 6. Python

**Weight: HIGH** for Python-first candidates (many Israeli students; Intel and Nvidia reports mention Python scripting and Python OOP; data and validation roles). Also the most common LeetCode language, so candidates are expected to understand its object model when they claim it.

### Concept map

1. **Everything is an object; names are references**
   - Assignment binds a name to an object, never copies. `b = a` with a list then `b.append(...)` changes `a`.
   - "Pass by object reference" (pass-by-assignment): mutating an argument is visible to the caller; rebinding is not.
2. **Mutable vs immutable types**
   - list, dict, set mutable; int, float, str, tuple, frozenset immutable. A tuple containing a list is immutable in shape but its list can change.
   - `s += "x"` creates a new string; `lst += [x]` mutates in place (vs `lst = lst + [x]` which rebinds).
3. **`is` vs `==`**
   - Identity vs equality. `is None` is the correct idiom. Small int / string interning makes `is` look like it works, which is a bug.
4. **Mutable default arguments**
   - Defaults are evaluated once at function definition; a default list is shared across calls. Fix with `None` sentinel.
5. **Shallow vs deep copy**
   - `list(x)`, slicing, `copy.copy` copy only the outer container; nested objects are shared. `[[0]*3]*3` creates three references to the same row.
6. **Hashability and dict/set**
   - Keys must be hashable (immutable, or with consistent `__hash__`/`__eq__`); why a list cannot be a dict key but a tuple of ints can.
   - Average O(1) lookup, membership in a list is O(n) vs set O(1). Dicts preserve insertion order (as behaviour, not a version trivia question).
7. **Scope (LEGB), closures, `global`/`nonlocal`**
   - Assigning to a name inside a function makes it local (UnboundLocalError when reading it before assignment).
   - Late binding in closures: lambdas created in a loop all see the final loop value.
8. **Iterators, iterables and generators**
   - `yield` produces values lazily and keeps state; generators are single-pass (consumed once). Memory benefit vs building a list. Generator expression vs list comprehension.
9. **Decorators**
   - A function that takes a function and returns a function; runs at definition time; relies on closures. Use cases: logging, timing, caching, auth.
10. **Classes and OOP in Python**
    - `self` is explicit; `__init__` initialises (not constructs; `__new__` constructs, one stretch item).
    - Class attributes vs instance attributes: a mutable class attribute is shared by all instances (classic bug).
    - No real private: `_name` convention, `__name` name mangling.
    - Duck typing: "if it has the method, it works"; ABCs for explicit interfaces.
    - `@staticmethod` vs `@classmethod` vs instance method.
    - `super()` and MRO for multiple inheritance (conceptual: deterministic left-to-right order).
    - Dunder methods: `__eq__`, `__hash__` (defining `__eq__` alone makes instances unhashable), `__str__` vs `__repr__`, `__len__`, `__iter__`.
11. **Exceptions and context managers**
    - try/except/else/finally flow; catching broad `Exception` hides bugs; EAFP vs LBYL style.
    - `with` guarantees cleanup (files, locks) even on exceptions.
12. **GIL and concurrency choice**
    - In CPython, threads do not run Python bytecode in parallel for CPU-bound work; threads help I/O-bound work; multiprocessing for CPU-bound; asyncio for many concurrent I/O waits.
13. **`*args` / `**kwargs`, unpacking**
    - Packing extra positional/keyword arguments; forwarding arguments in wrappers.
14. **Comprehensions and idioms**
    - Readability vs nested comprehensions; `enumerate`, `zip`; complexity of common operations (`list.insert(0, x)` is O(n), `deque` fixes it; `x in list` O(n)).
15. **Memory management (light)**
    - Reference counting plus a cycle collector; `del` removes a name, not necessarily the object.
16. **Type hints**
    - Not enforced at runtime; used by tools (mypy, IDEs).

### Traps and distractors

- "Python passes integers by value and lists by reference."
- "`a = b` copies the list."
- "Default arguments are re-evaluated on every call."
- "`is` and `==` are interchangeable for strings and numbers."
- "`copy.copy` copies nested lists."
- "A tuple can never change in any way."
- "Threads make CPU-bound Python code faster on multiple cores."
- "`__init__` creates the object."
- "Double underscore makes an attribute truly private."
- "A generator can be iterated twice."
- "Type hints raise errors at runtime when violated."

### Exclude

- Version history (2 vs 3 differences as trivia, which version added what), PEP numbers.
- Exact interning ranges for small ints, bytecode/dis, CPython internals beyond the GIL concept, free-threading build details.
- Metaclasses, descriptors protocol details, `__slots__` memory numbers, `asyncio` event loop APIs, specific library APIs (pandas, Django, Flask).

---

## 7. JavaScript / TypeScript

**Weight: HIGH for web-focused roles (Wix, Monday, many startups, full-stack student jobs), MEDIUM overall.** Wix student/frontend reports repeatedly mention closures, hoisting and "guess the output". TypeScript is asked lightly at junior level (any vs unknown, interface vs type, structural typing).

### Concept map (JavaScript)

1. **`var` / `let` / `const`, scope and hoisting**
   - Function scope vs block scope; declarations hoisted; `var` initialised to `undefined`, `let`/`const` in the temporal dead zone (ReferenceError).
   - `const` prevents rebinding, not mutation of the object.
   - Function declarations hoisted with their body; function expressions are not.
2. **Closures**
   - A function remembers variables of the scope where it was created. Uses: private state, factories, memoisation, debounce/throttle, partial application/currying.
   - Classic loop: `var` in a loop with `setTimeout` prints the final value; `let` creates a fresh binding per iteration.
   - Memory: closures keep referenced variables alive.
3. **`this` binding**
   - Determined by how a function is called (method call, plain call, `new`, `call/apply/bind`), not where it is defined. Arrow functions take `this` from the enclosing scope.
   - Losing `this` when passing a method as a callback; fixes (`bind`, arrow).
4. **Event loop and async**
   - Single-threaded call stack; Web APIs/runtime handle timers and I/O; callback (macrotask) queue vs microtask queue (promise reactions run before the next timer).
   - Output-ordering items: sync logs, then microtasks, then `setTimeout(..., 0)`.
   - `setTimeout(f, 0)` does not run immediately; a long sync loop blocks everything (UI freeze).
5. **Promises and async/await**
   - States (pending, fulfilled, rejected), chaining returns a new promise, error propagation to `.catch`.
   - `await` pauses only the async function, not the thread; sequential awaits vs `Promise.all` for parallelism; `Promise.all` rejects on first failure vs `allSettled`.
   - Unhandled rejections; forgetting `await` returns a promise instead of a value.
6. **Equality and coercion**
   - `==` coerces, `===` does not; `NaN !== NaN`; truthy/falsy values (`0`, `""`, `null`, `undefined`, `NaN`, `false`); `typeof null === "object"` as a known quirk (one item max).
7. **Primitives vs objects, reference semantics**
   - Objects/arrays are compared and passed by reference (value of the reference); spread/`Object.assign` are shallow copies; `structuredClone` for deep.
   - `null` vs `undefined` vs undeclared.
8. **Prototypes and classes**
   - Prototype chain lookup; `class` is mostly syntax over prototypes; methods live on the prototype (shared), fields on instances.
   - `new` steps conceptually: create object, link prototype, call constructor with `this`, return it.
9. **Functions as values**
   - Higher-order functions, callbacks, `map`/`filter`/`reduce` vs mutation; pure functions.
   - Array methods that mutate (`sort`, `splice`, `push`) vs return new (`map`, `slice`, `concat`); `sort` default is lexicographic.
10. **Map/Set vs plain object**
    - Any key type, insertion order, size; object keys are coerced to strings.
11. **DOM events (frontend roles)**
    - Bubbling vs capturing, event delegation (one listener on a parent), `preventDefault` vs `stopPropagation`.
12. **Modules**
    - ES modules vs CommonJS at a concept level (static imports, live bindings vs copied exports), module scope avoids globals.
13. **Debounce / throttle (Wix reports)**
    - What each does, when to use (search-as-you-type vs scroll), built from closures and timers.

### Concept map (TypeScript)

1. **What TS adds and what it does not**
   - Static types checked at compile time and erased at runtime; no runtime validation of API data.
2. **`any` vs `unknown` vs `never`**
   - `any` disables checking; `unknown` forces narrowing before use (safe for external input); `never` for impossible cases (exhaustive switch).
3. **Structural typing**
   - Compatibility by shape, not by name; an object with extra properties can be assigned via a variable (excess property check only on fresh literals).
4. **`interface` vs `type`**
   - Both describe object shapes; interfaces can merge declarations and `extends`; type aliases can express unions, tuples, mapped types. Convention, not a big deal.
5. **Union types and narrowing**
   - `typeof`, `in`, discriminated unions with a `kind` field, type guards.
6. **Generics**
   - Reusable typed functions/containers; constraints (`T extends ...`).
7. **Optional and null safety**
   - `strictNullChecks`, optional properties, `?.` and `??` vs `||` (0 and "" are falsy).
8. **Classes in TS**
   - `private` (compile time only) vs `#private` (runtime), `readonly`, abstract classes, implementing interfaces.

### Traps and distractors

- "`const` makes an object immutable."
- "`let` is not hoisted at all" (it is hoisted but uninitialised: TDZ).
- "`setTimeout(fn, 0)` runs before promise callbacks."
- "`await` blocks the whole program / makes code multithreaded."
- "Arrow functions have their own `this`."
- "`this` refers to the function itself" or "to where the function was defined".
- "Spread makes a deep copy."
- "`==` and `===` differ only in performance."
- "JS classes are a separate model from prototypes."
- "`[10, 9, 1].sort()` sorts numerically."
- TS: "TypeScript types are checked at runtime", "`unknown` and `any` are the same", "TS uses nominal typing like Java", "`private` hides the field at runtime".
- `??` vs `||` with `0`.

### Exclude

- ECMAScript edition numbers and release years, TC39 stage process.
- Browser API catalogue (AbortController, SSE, workers detail, property descriptors, Proxy/Reflect), `mouseenter` vs `mouseover`, AJAX history, `XMLHttpRequest`.
- Engine internals (V8 hidden classes, GC algorithms), labelled statements, `with`, tagged templates details.
- Framework specifics (React hooks, Angular DI, Node streams). React could be its own topic later for web roles; not in this bank.
- TS advanced types (conditional/infer, template literal types, variance annotations, declaration files, compiler flags).

---

## Sources

| # | URL | Quality / notes |
|---|---|---|
| 1 | https://www.theworker.co.il/company/interviews/%D7%A0%D7%99%D7%99%D7%A1/NICE/%D7%A1%D7%98%D7%95%D7%93%D7%A0%D7%98%20(%D7%AA%D7%95%D7%9B%D7%A0%D7%94) | High value: real Israeli student (software) interview reports at NICE, in Hebrew; strong signal for polymorphism, abstract classes, inheritance, Java, design patterns. |
| 2 | https://www.glassdoor.com/Interview/Intel-Corporation-Software-Engineer-Student-Interview-Questions-EI_IE1519.0,17_KO18,43.htm | Real Intel Israel student reports; low-level C/asm and DS heavy, little pure OOP. Shows the C++ skew. |
| 3 | https://www.glassdoor.com/Interview/they-were-asking-basic-c-c-questions-and-linked-list-questions-OOPs-concept-and-Python-programming-QTN_5571926.htm | Intel GPU SW report (snippet): C/C++, OOP concepts, Python. Single report. |
| 4 | https://www.glassdoor.com/Interview/Elbit-Systems-Software-Engineer-Interview-Questions-EI_IE7325.0,13_KO14,31.htm | Snippet: Elbit focuses on core CS, OOP principles, basic DS. |
| 5 | https://www.glassdoor.com/Interview/Wix-Software-Developer-Student-Position-Interview-Questions-EI_IE391615.0,3_KO4,39.htm | Wix student/frontend reports (via search summary): closures, hoisting, debounce, currying, guess-the-output. Small sample. |
| 6 | https://www.tech-interview.co.il/filters | Israeli question bank; categories (OOP, Multithreading, OS, C&C++, Python, Java, JS) confirm the Israeli topic mix. Question text not viewed. |
| 7 | https://codegym.cc/he/groups/posts/he.402.html | Hebrew list of 150 Java interview questions; generic, OOP-first. Medium quality. |
| 8 | https://javarevisited.blogspot.com/2020/05/object-oriented-programming-questions-answers.html | 40 OOP questions; good coverage of comparisons (overload/override, composition/inheritance, coupling/cohesion, State vs Strategy). Medium-high quality. |
| 9 | https://www.geeksforgeeks.org/interview-prep/oops-interview-questions/ | Broad OOP list; useful for coverage, shallow answers. Medium. |
| 10 | https://www.interviewbit.com/oops-interview-questions/ | OOP list plus MCQ; shows the common abstraction-vs-encapsulation framing. Medium. |
| 11 | https://www.geeksforgeeks.org/system-design/top-design-patterns-interview-questions/ | Confirms the junior pattern set: Singleton, Factory, Adapter, Strategy, Observer, Decorator. Medium. |
| 12 | https://www.reddit.com/r/cscareerquestions/comments/6qqso0/what_design_patterns_have_you_been_asked_about_in/ | Practitioner thread on patterns actually asked (could not fetch; title and search context only). |
| 13 | https://www.reddit.com/r/cscareerquestions/comments/13otvbb/could_you_explain_the_5_solid_principles_off_the/ | Practitioner discussion of SOLID expectations; snippet shows the common shallow LSP definition (good distractor source). |
| 14 | https://www.reddit.com/r/cscareerquestions/comments/u7ffbe/topics_to_know_as_a_new_grad/ | New-grad topics thread (snippet only). |
| 15 | https://dev.to/lourdesyang1023/mastering-software-development-best-practices-top-interview-questions-and-answers-solid-kiss-1k5g | SOLID/KISS/DRY/YAGNI interview framing with the Square/Rectangle LSP example. Medium. |
| 16 | https://ophyai.com/blog/interview-tips/python-interview-questions | 24 Python concepts with "what it tests"; well aligned to understanding over trivia. Medium-high. |
| 17 | https://interviewfury.com/interview-questions/python | Python freshers list (snippet): list vs tuple, decorators, generators, GIL, copying. Medium. |
| 18 | https://github.com/greatfrontend/top-javascript-interview-questions | Ranked JS questions with Basic/Intermediate/Advanced labels; great for weighting. License: no LICENSE file found at repo root (treat as all rights reserved; use for topic mapping only). |
| 19 | https://github.com/sudheerj/javascript-interview-questions | 1000 JS questions; huge, many trivia items. License not verified (GitHub API blocked in this session); assume not reusable. |
| 20 | https://github.com/lydiahallie/javascript-questions | JS "what's the output" MCQs; MIT license (verified LICENSE file). Good model for output-reasoning format. |
| 21 | https://github.com/yangshun/tech-interview-handbook (https://www.techinterviewhandbook.org/coding-interview-prep/) | MIT license (verified). Says interviewers expect strong knowledge of language constructs; design mostly for mid/senior. |
| 22 | https://github.com/iluwatar/java-design-patterns | MIT license (verified). Reference catalogue of patterns in Java; useful to check our pattern explanations. |
| 23 | https://www.reddit.com/r/learnjavascript/comments/1vinp5g/10_javascript_questions_that_came_up_in_almost/ | Snippet: hoisting, var/let/const, ReferenceError, event loop recur in frontend interviews. |
| 24 | https://dev.to/libintombaby/value-types-vs-reference-types-struct-vs-class-and-boxing-unboxing-the-complete-c-guide-2cif | C# value/reference types and boxing as the core junior C# topic. Medium. |
| 25 | https://coddy.tech/docs/typescript/interview-questions and https://www.datacamp.com/blog/typescript-interview-questions | TS junior topics: any vs unknown, structural typing, interface vs type. Medium. |
| 26 | https://www.interviewbit.com/java-string-interview-questions and https://howtodoinjava.com/interview-questions/core-java-interview-questions/ | Java freshers: string pool, immutability, final/finally/finalize, checked vs unchecked. Medium. |
| 27 | https://dataford.io/questions/explain-the-concept-of-virtual-destructors-in-c-and-why-they-are-critical-when-working-with-inheritance | C++ virtual destructor as a recurring junior OOP item (for the C++ group). |

---

## Recommended topic list and relative question counts (this group)

Assume a group budget of about 300 questions; scale proportionally.

| Topic (quiz-bank id suggestion) | Weight | Share | ~Questions | Notes |
|---|---|---|---|---|
| OOP fundamentals (`oop`) | High | 26% | 80 | Polymorphism/dispatch 15, overload vs override 8, abstract class vs interface 10, composition vs inheritance 10, encapsulation/abstraction 10, constructors/static/lifecycle 8, access modifiers 5, identity vs equality 4, OOD-lite scenarios 10. Include 4-6 C#-tagged and a few C++-tagged dispatch items. |
| Java (`java`) | High (if CV language) | 18% | 55 | equals/hashCode 8, pass-by-value 5, String/immutability 6, collections choice + HashMap 12, exceptions 8, final/static 5, memory/GC 4, generics 3, concurrency basics 4. |
| Python (`python`) | High | 18% | 55 | References/mutability/copy 12, defaults/scope/closures 8, dict/set/hashability 6, generators/iterators 6, decorators 4, Python OOP 10, exceptions/with 4, GIL/concurrency choice 3, complexity of built-ins 2. |
| JavaScript (`javascript`) | High for web | 15% | 45 | Scope/hoisting 7, closures 8, this 6, event loop/output ordering 8, promises/async 7, equality/coercion 3, references/copies 3, prototypes/classes 3. |
| TypeScript (`typescript`) | Low-Medium | 4% | 12 | any/unknown/never, structural typing, interface vs type, unions/narrowing, generics, `??` vs `||`. Could be a subtopic of JavaScript. |
| SOLID and clean code (`solid`) | Medium | 11% | 35 | 5 principles x ~5 "which principle is violated / which refactor fixes it" scenarios = 25, plus DRY/KISS/YAGNI, coupling/cohesion, testability 10. |
| Design patterns (`patterns`) | Medium-Low | 7% | 20 | Singleton 4, Factory 3, Strategy 4, Observer 4, Builder/Adapter/Decorator 4 (one each plus a comparison), "when not to use a pattern" 1. Mostly "which pattern fits this scenario". |
| C# | Low | 1% (folded into OOP) | 0-5 | No separate topic; tag a few OOP items. |

Format guidance from the research:
- Favour scenario and "what does this print / which call runs" stems with short code (5-12 lines) in the relevant language; Wix, Lydia Hallie-style output reasoning and Java dispatch questions all use this.
- Each wrong option should map to one named misconception listed above, so explanations can teach the fix.
- Keep language items "understanding of semantics" (references, dispatch, async ordering, mutability); never ask for version numbers, exact constants or API names.
