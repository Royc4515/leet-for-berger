# Quiz bank research: Data structures, Algorithms and Big-O, C/C++, Bits and number representation

Audience: first SWE job (junior / new grad) and student positions, many in Israel.
Goal: map the CONCEPTS interviewers probe so we can write our own multiple-choice questions that test understanding ("why", "what happens if", "which fits here"), not trivia.

Research note: the web scraper ran out of credits partway through the research, so several Glassdoor pages (which block plain fetches) were seen only through search snippets and search-engine summaries. The Israeli evidence below comes from those summaries, from TheWorker (Hebrew, read directly) and from Taro reports. It is anecdotal: treat it as direction, not statistics.

---

## 0. Israeli student and junior roles: what the evidence says

**Short answer: yes. At hardware and chip companies (Intel, Nvidia, Apple IL, Qualcomm, Mobileye) and at security / low-level shops (Check Point, Rafael), the interview leans clearly toward C/C++, pointers, memory and bits. At product and web companies (Wix, Monday, Microsoft IL product teams, Amdocs), it leans toward DS&A plus OOP.**

Evidence (all paraphrased):
- **Intel (Haifa, Jerusalem, Petah Tikva)**. Glassdoor "Software Engineer Student": candidates present a school project and defend implementation decisions, then get technical questions. The general Intel SWE page says interviews focus mainly on C/C++ questions plus LeetCode-style coding. TheWorker (Hebrew, Intel student) reports: reverse a linked list, partitioning colored balls in place with two indices and no extra memory, sorting an almost-sorted array (each element at most k positions off), converting hex to binary, writing C code for the clock-hand angle, assembly-flavored "multiply using only addition", plus many logic puzzles. A Blind thread says Intel has no standard process: system-software teams lean toward pointers, compiler teams toward algorithms.
- **Intel-style coding rounds** (autocoder.live guide): predicting C/C++ output (static locals, pre/post increment, virtual destructor order), operator precedence with shifts, integer promotion with signed vs unsigned comparison, unsequenced-modification UB, lowest set bit, trailing zeros, XOR swap, add without `+`, overflow-safe binary search, cache-friendly matrix transpose.
- **Nvidia (Yokneam, Tel Aviv, Ra'anana)**. Glassdoor reports list "linked list, bit operators, C memory layout", and process vs thread, virtual memory, mutex vs semaphore. A Reddit post notes Nvidia has no shared question bank: interviewers write domain questions, often not LeetCode.
- **Apple (Herzliya, Haifa)**. Student / embedded reports: merge sorted lists, LRU cache, hashmap and graph questions, a C data-structure question for unbounded input. US Apple embedded / CoreOS screens: basic C, pointer arithmetic, bit manipulation, "detect the machine's endianness" as a first question.
- **Qualcomm** (no Israel-specific data found; global reports): set or clear bits, macro to copy m bits at offset n, count set bits, reverse bits of a byte, change endianness, `volatile` and `const`, memcpy with overlap. One OA had 20 multiple-choice questions on C/C++ output, DS and OS. That validates multiple choice as a realistic format.
- **Mobileye (Jerusalem)**. Student reports: talk through your project, read a printed C function and answer questions about it, reverse words in O(n) time and O(1) space, DP and sorting. C++ developer reports: "what does this code do, how would you improve it", thread-safe queue.
- **Check Point (Tel Aviv)**. Returning a pointer to a local array, buffer overflow, a buggy `strcat` to fix, implementing `atoi`, malloc/free from scratch under a memory limit, fixing memory leaks in a C project, pointer and thread questions.
- **Rafael** (TheWorker student list): C code review, buffer overflow. **Microsoft IL** student: LRU cache (DS&A).
- Hebrew sources: TheWorker student pages (reports per company), tech-interview.co.il (Hebrew bank with categories for algorithms and data structures, OS, C/C++, embedded, chip design, logic). The JobHunt community "1,000 questions" doc is heavy on logic riddles. Israeli interviews often add **logic puzzles** and a **"present your project"** segment. Both are outside this group but worth noting.

**Implication for the bank:** add an "Israel / low-level track" emphasis: C memory model, pointers, struct layout, bits, endianness, `volatile` / `const`, UB, plus code-reading ("what does this function print / what is wrong"). Code-reading multiple-choice questions are realistic: they mirror the Mobileye printed-code round and the Qualcomm C-output multiple-choice questions.

---

## 1. Data structures

### 1.1 Weight
- **General junior / new grad: HIGH.** Every coding round silently tests "which structure, and what does each operation cost". Interviewers ask candidates to justify the choice.
- **Israeli student roles: HIGH.** Linked lists (reverse, merge, cycle), hash maps and LRU caches show up at Intel, Apple IL, Microsoft IL and Nvidia. At chip companies, expect "implement it in C", so pointers come in.

### 1.2 Concept map

1. **Arrays and dynamic arrays (vector / ArrayList / Python list / JS array)**
   - O(1) random access because address = base + i * size. Why linked lists cannot do this.
   - Insert or delete in the middle is O(n) because of shifting. Append is amortized O(1).
   - Amortized analysis of doubling: why growing by a constant factor gives O(1) amortized but growing by +k gives O(n) per append.
   - Resizing invalidates pointers, iterators and references into the old buffer (C++ vector).
   - Cache locality: contiguous memory makes arrays faster in practice than lists with the same Big-O.
2. **Linked lists (singly, doubly, circular)**
   - O(1) insert or delete given the node (singly: you need the predecessor), O(n) search and index.
   - When a list beats an array: frequent splicing in the middle with a handle, no reallocation, stable addresses.
   - Sentinel / dummy head nodes simplify edge cases.
   - Fast and slow pointers: find the middle, detect a cycle (Floyd), find the k-th from the end.
   - Reversing in place: the three-pointer idea. Losing the `next` reference is the classic bug.
3. **Stacks and queues**
   - LIFO vs FIFO, and what problems each fits: undo, parentheses matching and DFS for stacks; BFS, scheduling and buffering for queues.
   - Array-backed vs list-backed. A circular buffer for a fixed-size queue (full vs empty ambiguity).
   - A queue built from two stacks: amortized O(1).
   - Deque. Monotonic stack or queue as an idea (next greater element, sliding window max).
   - Call stack = a stack. Recursion can be converted to an explicit stack.
4. **Hash tables (internals)**
   - Hash function -> bucket index (mod table size). Average O(1), worst case O(n).
   - Collision resolution: separate chaining vs open addressing (linear probing, clustering). Deletion in open addressing needs tombstones.
   - Load factor and rehashing: why resize, cost O(n) per resize, amortized O(1).
   - What makes a good hash: deterministic, uniform, fast. Equal keys must have equal hashes (equals / hashCode contract).
   - Mutable keys: changing a key after insertion "loses" the entry.
   - Unordered: no sorted iteration, no range queries. Python dict / JS Map preserve insertion order, which is not sorted order.
   - Hash set vs hash map. Counting frequencies. Space-for-time tradeoff.
   - Adversarial inputs and worst-case behavior (why Java 8 turns long chains into trees). Concept only.
5. **Trees and binary search trees**
   - Terminology: root, leaf, height vs depth, full / complete / perfect / balanced.
   - BST property and in-order traversal gives sorted output.
   - BST operations are O(h). h = log n if balanced, n if degenerate (sorted inserts produce a "linked list").
   - Why balanced trees exist (AVL / red-black as names only), and `std::map` / TreeMap being O(log n) ordered maps.
   - Hash map vs balanced BST: O(1) average vs O(log n) guaranteed plus ordering, range queries, min/max, floor/ceiling.
   - Traversals: pre, in, post-order (DFS), level order (BFS). Which one fits which task (copying a tree, deleting a tree, printing by level).
   - Number of nodes vs height: a perfect tree of height h has 2^(h+1) - 1 nodes.
6. **Heaps and priority queues**
   - Heap property (min / max). Complete binary tree stored in an array: children of i at 2i+1 and 2i+2, parent at (i-1)/2.
   - Insert and extract are O(log n), peek is O(1). Build-heap is O(n), not O(n log n) (the "why" is a good question).
   - A heap is NOT sorted. Searching for an arbitrary element is O(n).
   - Top-k pattern: a min-heap of size k for the k largest, O(n log k). When sorting is simpler.
   - Merge k sorted lists, a running median with two heaps, Dijkstra's frontier.
7. **Graphs (basics)**
   - Representations: adjacency list vs matrix. Space O(V+E) vs O(V^2). Edge lookup O(deg) vs O(1). Sparse vs dense.
   - Directed / undirected, weighted / unweighted, cyclic / acyclic, connected components.
   - A tree is a connected acyclic graph with V-1 edges.
   - BFS and DFS cost O(V+E). The visited set: why you need it in graphs but not in trees.
   - Topological sort only exists for DAGs (concept, use case: build order).
   - Shortest path: BFS for unweighted graphs, Dijkstra for non-negative weights (why negative edges break it). Concept level.
8. **Tries** (medium)
   - Prefix lookups in O(L) where L is the key length, independent of the number of words. Memory cost. Autocomplete.
9. **Union-Find** (low-medium)
   - Connectivity / grouping. Near-constant time with path compression and union by rank (names, not proofs).
10. **Choosing a structure ("which fits here")**
    - LRU cache = hash map + doubly linked list. Why each part is needed.
    - "Need ordering plus fast lookup" -> balanced BST / TreeMap. "Need min repeatedly" -> heap. "Membership only" -> hash set.
    - Space vs time tradeoffs. Built-in names per language (Python `heapq` is a min-heap, `collections.deque`, C++ `priority_queue` is a max-heap by default).

### 1.3 Traps and misconceptions (good distractors)
- "Hash table lookup is always O(1)" (it is average, worst case O(n); resizing is O(n) once).
- "A linked list insert is O(1)" without noting you must first find the position (O(n)).
- "A heap is sorted" / "in-order traversal of a heap is sorted" / "finding an element in a heap is O(log n)".
- "BST search is O(log n)" ignoring degenerate trees.
- "Building a heap is O(n log n)" (tight bound is O(n)).
- "Python dict / JS object iterates in sorted key order".
- "An adjacency matrix is always better because edge lookup is O(1)" (O(V^2) space for sparse graphs).
- Confusing height and depth, or complete and full trees.
- "Arrays and linked lists have the same real-world speed for traversal" (cache effects).
- "Appending to a dynamic array is O(n) because it sometimes copies" (amortized O(1)).
- "A queue from two stacks costs O(n) per dequeue" (amortized O(1)).
- Using a hash map when ordered iteration or range queries are required.

### 1.4 Exclude (trivia or too advanced)
- Red-black / AVL rotation cases, B-tree split details, skip list probabilities, Fibonacci heap amortization.
- Exact load-factor constants of particular libraries (0.75 in Java) as the answer to a question. Fine as context.
- Segment trees, Fenwick trees, suffix arrays, treaps (competitive-programming level).
- Proofs of union-find inverse Ackermann bounds.
- Specific hash functions (MurmurHash, SipHash) beyond "why randomized hashing exists".

---

## 2. Algorithms and Big-O

### 2.1 Weight
- **General junior / new grad: HIGH.** "What is the complexity, and can you do better?" is asked in almost every coding round. Understanding recursion cost and choosing BFS vs DFS or greedy vs DP is core.
- **Israeli student roles: HIGH.** The same, with extra emphasis on in-place / O(1) extra space (Intel "no extra memory" ball partitioning, Mobileye "reverse words in O(1) space") and on efficiency discussions. Chip companies also like cache-aware reasoning (matrix traversal order).

### 2.2 Concept map

1. **Big-O fundamentals**
   - O, Omega, Theta in intuition terms. Big-O is an upper bound on growth, not on actual time.
   - Dropping constants and lower terms. Why O(2n) = O(n), but constants still matter in practice.
   - Ordering classes: 1 < log n < sqrt(n) < n < n log n < n^2 < 2^n < n!.
   - Best, average, worst case are separate from O / Theta (quick sort average vs worst).
   - Multiple inputs: O(n + m) vs O(n * m). Do not collapse them into one n.
   - Estimating from constraints: n = 10^5 implies roughly O(n log n) or better. n <= 20 hints at 2^n.
2. **Analyzing code**
   - Nested loops: dependent bounds (j from i to n is still O(n^2)). Halving loops are O(log n).
   - Loops that look nested but are amortized linear (two pointers, sliding window: each index moves at most n times).
   - Hidden costs: string concatenation in a loop, `list.pop(0)` / `array.shift()`, `in` on a list, slicing copies, `substring` creating copies.
   - Space complexity: auxiliary vs total, recursion stack counts as space, output space.
   - Amortized analysis (dynamic array, two-stack queue).
3. **Recursion**
   - Base case and progress toward it. Missing base case -> stack overflow.
   - Recursion tree for cost: fib naive is O(2^n) (roughly phi^n), with O(n) stack depth.
   - Stack depth as space: a recursive DFS on a degenerate tree or long list uses O(n) stack and can overflow (Python default limit around 1000, which is a practical "what happens if").
   - Tail recursion: not optimized in Python, Java or most JS engines.
   - Master theorem intuition only: T(n) = 2T(n/2) + O(n) -> O(n log n). T(n) = T(n/2) + O(1) -> O(log n).
   - Recursion vs iteration tradeoffs.
4. **Sorting**
   - Comparison sorts have an Omega(n log n) lower bound. Counting / radix sort beat it by not comparing (needs a bounded key range).
   - Properties table: stable? in-place? worst case? adaptive?
     - Merge sort: stable, O(n log n) always, O(n) extra (arrays), great for linked lists and external sorting.
     - Quick sort: not stable, in-place (O(log n) stack), O(n^2) worst case with bad pivots (already sorted input plus first-element pivot), fast in practice due to cache use.
     - Heap sort: not stable, in-place, O(n log n) worst case, poor cache behavior.
     - Insertion sort: stable, in-place, O(n^2), but O(n) on nearly-sorted data. Good for small n (why hybrids use it).
     - Selection sort: minimal swaps, not stable (array version), always O(n^2).
     - Bubble sort: stable, O(n) best case with an early exit.
   - What stability means and when it matters (sorting by a secondary key, then a primary key).
   - Built-ins: Python and Java object sort use Timsort (stable). C++ `std::sort` is not stable, `std::stable_sort` is. JS `Array.prototype.sort` must be stable since ES2019 and sorts as strings by default (a famous trap for numbers).
   - Partial sorting / selection: k-th element via quickselect is O(n) average. Sorting just to get the max is wasteful.
   - Nearly sorted with distance k: a heap of size k+1, O(n log k) (this is literally an Intel student question).
5. **Binary search**
   - Precondition: sorted or monotonic predicate. O(log n).
   - Invariants and off-by-one: `lo <= hi` vs `lo < hi`, `hi = mid` vs `mid - 1`. Infinite loops when `lo = mid`.
   - Overflow-safe midpoint: `lo + (hi - lo) / 2` instead of `(lo + hi) / 2` (in C/C++/Java with int).
   - Variants: first or last occurrence, insertion point (lower / upper bound), search on the answer space (minimum capacity, square root).
   - Rotated sorted array idea. Why binary search does not work on a linked list efficiently.
6. **Two pointers, sliding window, prefix sums** (concept level, as these are covered as coding problems elsewhere)
   - Why they turn O(n^2) into O(n). When they apply (sorted input, monotonic window condition).
   - Prefix sums for O(1) range sum queries after O(n) preprocessing.
7. **BFS vs DFS**
   - BFS uses a queue and finds shortest paths in unweighted graphs. Level-order.
   - DFS uses a stack or recursion: cycle detection, topological order, connected components, backtracking, path existence.
   - Memory profile: BFS stores a frontier (wide trees blow it up), DFS stores a path (deep trees blow it up).
   - Marking visited when enqueuing vs when dequeuing (duplicates in the queue).
   - Grid problems as implicit graphs.
8. **Greedy**
   - Make the locally best choice and never revisit. Works only with the greedy-choice property.
   - Classic correct greedy: interval scheduling by earliest end time, activity selection, Huffman (name).
   - Classic failure: coin change with arbitrary denominations ({1, 3, 4} for 6), 0/1 knapsack (vs fractional, where greedy works).
   - Proof idea: exchange argument (intuition only).
9. **Dynamic programming**
   - Two ingredients: overlapping subproblems and optimal substructure. Divide and conquer has no overlap (merge sort), so memoizing it gains nothing.
   - Memoization (top-down, recursion plus cache, computes only needed states, recursion depth risk) vs tabulation (bottom-up, loop order matters, no stack, easier space optimization).
   - State definition and transition. Complexity = number of states * work per state.
   - Space optimization: keeping only the previous row or two variables (fib, climbing stairs).
   - Greedy vs DP intuition: when a local choice can be wrong, you need DP.
10. **Backtracking**
    - Exploring choices with undo. Pruning. Exponential complexity (subsets 2^n, permutations n!).
11. **Practical complexity sense**
    - Cache locality and memory access patterns (row-major traversal of a 2D array in C). Big-O hides this.
    - When O(n log n) sorting beats an O(n) hash approach in practice (small n, memory), as a judgment question.

### 2.3 Traps and misconceptions (good distractors)
- "Two nested loops always means O(n^2)" (sliding window / two pointers are O(n)). And the reverse: "a single loop is O(n)" when the body calls an O(n) operation (`list.remove`, `indexOf`, string concat).
- "O(log n) with base 2 differs from base 10" (bases differ by a constant).
- "Recursion uses no extra memory".
- "Memoization changes fib from O(2^n) to O(log n)" (it becomes O(n)).
- "Quick sort is O(n log n)" stated without "average". "Merge sort is in-place".
- "Stable sort means it does not crash / is deterministic".
- "Binary search works on any array". "Binary search on a linked list is O(log n)".
- "BFS finds shortest paths in weighted graphs".
- "DFS always finds the shortest path".
- "Greedy works for coin change" (only for canonical coin systems).
- "DP is just recursion" / "any recursion benefits from memoization".
- "Big-O is the running time" / "O(n) is always faster than O(n log n) for every input size".
- "Sorting numbers with JS `.sort()` without a comparator sorts numerically".
- `(lo + hi) / 2` is safe in Java/C int.

### 2.4 Exclude
- Formal proofs of the master theorem, Akra-Bazzi, amortized potential-function proofs.
- NP-completeness reductions (a single "what is NP-hard" intuition question is fine, at most).
- Advanced graph algorithms: max flow, Tarjan's SCC details, A* heuristics, Bellman-Ford internals beyond "handles negative weights".
- Advanced string algorithms (KMP failure function construction, Z-algorithm), FFT.
- Exact constants of Timsort / introsort thresholds.
- Asking which algorithm a language uses internally as pure recall. Fine only when tied to a consequence (stability).

---

## 3. C and C++

### 3.1 Weight
- **General junior / new grad (US-style web / product roles): LOW to MEDIUM.** Most candidates code in Python / Java / JS. C++ conceptual questions appear mainly for systems, game, embedded or HFT roles.
- **Israeli student roles: HIGH at chip / hardware / embedded / security companies** (Intel, Nvidia, Apple IL, Qualcomm, Mobileye, Check Point, Rafael, Elbit, Marvell, Broadcom, Hailo). Israeli CS / EE degrees teach C and C++ early (often the first-year language), and interviewers assume it. Expect code reading, "what does this print", "find the bug", pointers, memory, struct layout, virtual functions. **MEDIUM at Microsoft IL, Amdocs, Wix, Monday** (OOP concepts, which overlap with C++ virtual / polymorphism).
- Recommendation: make this a first-class topic with a "low-level" tag so users targeting hardware companies can drill it.

### 3.2 Concept map

1. **Memory layout of a C program**
   - Text (code), data (initialized globals / statics), BSS (zero-initialized), heap, stack. Where string literals live (read-only).
   - Lifetime vs scope: automatic (stack), static (whole program), dynamic (heap, until `free` / `delete`).
   - Static locals: initialized once, keep their value between calls (a common output-prediction question).
   - Stack growth, stack frames, why deep recursion overflows. Stack is fast and automatically freed. Heap is flexible but needs management and is slower.
2. **Pointers**
   - A pointer holds an address. `&` takes an address, `*` dereferences. NULL / `nullptr`.
   - Pointer arithmetic scales by the pointed-to type size (`p + 1` moves `sizeof(*p)` bytes).
   - Pointer to pointer (modifying a caller's pointer, e.g. head of a list).
   - `void*` cannot be dereferenced or used in arithmetic in standard C.
   - Function pointers (callbacks, dispatch tables). Medium.
   - Dangling pointers (returning the address of a local, use after free), wild (uninitialized) pointers, double free.
   - Pass by value: a function that assigns its pointer parameter does not change the caller's pointer.
3. **Arrays vs pointers**
   - Array decays to a pointer to its first element in most expressions. Exceptions: `sizeof`, `&arr`, string-literal initialization.
   - `sizeof(arr)` in the declaring scope gives total bytes. Inside a function taking `int arr[]` it gives pointer size. Why you must pass the length.
   - `arr` is not assignable. A pointer is.
   - `char s[] = "hi"` (modifiable copy, 3 bytes) vs `char *s = "hi"` (pointer to a read-only literal; writing is UB).
   - `a[i]` equals `*(a + i)`. 2D arrays are row-major. `int (*p)[N]` vs `int *p[N]` (pointer to array vs array of pointers). Medium.
   - Strings: null terminator, `strlen` vs `sizeof`, buffer overflow with `strcpy` / `gets`, off-by-one for the terminator.
4. **Dynamic memory**
   - `malloc` / `calloc` / `realloc` / `free`. `calloc` zeroes. `realloc` may move the block (old pointer invalid). Always check for NULL.
   - `new` / `delete` vs `malloc` / `free`: constructors and destructors run, no mixing. `new[]` needs `delete[]`.
   - Memory leaks: losing the last pointer, early returns, exceptions. Tools: Valgrind / AddressSanitizer (names).
   - Fragmentation (concept). Heap allocation cost relative to stack.
   - How a simple allocator might work (free list idea). Concept only, since Check Point asked to build one.
5. **Undefined behavior**
   - What UB means: the compiler may assume it never happens, so anything can result, including "seems to work".
   - Examples: signed integer overflow, out-of-bounds access, null dereference, use after free, uninitialized reads, modifying a variable twice without sequencing (`i = i++ + 1` in older standards), shifting by >= the bit width or shifting a negative, data races, missing return value used.
   - Unsigned overflow is defined (wraps modulo 2^N). Signed overflow is UB. This is a high-value distinction.
   - Implementation-defined vs unspecified vs undefined (light touch).
6. **`const`, `static`, `volatile`, `extern`**
   - `const int *p` (pointee is const) vs `int *const p` (pointer is const) vs both. Read right to left.
   - `const` member functions. `const&` parameters avoid copies and accept temporaries.
   - `static`: local persistence, file-scope internal linkage, class static members (shared, no `this`).
   - `volatile`: value may change outside program flow (hardware registers, ISR-shared flags). It prevents caching in a register / reordering by the compiler. It is NOT a synchronization or atomicity tool. High value for Intel / Qualcomm / Apple embedded.
   - `#define` vs `const` vs `inline` / `constexpr`: macro pitfalls (missing parentheses, double evaluation of `MAX(i++, j)`).
7. **References (C++)**
   - A reference is an alias: must be initialized, cannot be reseated, no null reference.
   - Pass by value vs by pointer vs by reference vs by const reference: cost and intent.
   - Returning a reference to a local is dangling.
   - Lvalue vs rvalue and move semantics at the intuition level (why `std::move` avoids a copy; moved-from objects are valid but unspecified). Medium-low.
8. **Classes, constructors, the rule of three / five / zero**
   - Constructor, destructor, copy constructor, copy assignment. When each is called (pass by value calls the copy constructor).
   - Shallow vs deep copy: default copy of a class holding a raw pointer -> double free.
   - Rule of three / five / zero as the reasoning, not memorized names.
   - Initialization order: members in declaration order, base before derived. Destruction in reverse.
   - `struct` vs `class` in C++: only the default access differs.
9. **Polymorphism, virtual functions, vtables**
   - Static vs dynamic dispatch. A virtual call through a base pointer / reference calls the derived override. A call on an object by value (slicing) does not.
   - Vtable / vptr mechanism: one table per class, one hidden pointer per object, an indirect call. The cost: object size grows by a pointer, calls cannot be inlined.
   - Virtual destructor: deleting a derived object through a base pointer without a virtual destructor is UB (leaks, partial destruction). Very commonly asked.
   - Calling virtual functions from constructors / destructors does not dispatch to the derived class.
   - Pure virtual functions and abstract classes (interfaces). `override` and `final` keywords.
   - Object slicing when copying derived into base by value.
   - Overloading (compile time) vs overriding (run time). Hiding a base overload by declaring a same-named function.
10. **RAII and smart pointers**
    - RAII: tie resource lifetime to object lifetime. Destructors run during stack unwinding, so resources are released even on exceptions.
    - `unique_ptr`: sole ownership, movable not copyable, zero overhead.
    - `shared_ptr`: reference counted (control block, atomic count cost). Cycles leak -> `weak_ptr` breaks them.
    - `make_unique` / `make_shared` preferred. Do not create two `shared_ptr`s from the same raw pointer.
    - Lock guards / file handles as RAII examples.
11. **Struct layout, padding, `sizeof`**
    - Alignment requirements: members are placed at multiples of their alignment. The struct size is rounded up to its largest member alignment (so arrays of it stay aligned).
    - Member order changes `sizeof` (char, int, char = 12 vs int, char, char = 8 on typical platforms).
    - `#pragma pack` / packed attributes: smaller but possibly slower or faulting unaligned access.
    - `sizeof` is compile time (except VLAs). `sizeof(char) == 1` always. Pointer size depends on the platform (4 vs 8), not on the pointee type.
    - Union: size of the largest member; all members share storage. Use for type punning (in C) and tagged variants.
    - Empty class size is 1 in C++. A class with virtual functions gains a vptr.
    - Bit-fields exist (layout is implementation-defined).
12. **Compilation model** (medium-low)
    - Preprocess -> compile -> assemble -> link. Header guards. Declaration vs definition, "undefined reference" is a linker error.
    - `inline`, `extern "C"` (name mangling) as recognition-level ideas.
13. **STL usage concepts** (medium)
    - `vector` vs `list` vs `deque`, `map` (red-black tree, ordered, O(log n)) vs `unordered_map` (hash, O(1) average).
    - Iterator invalidation (vector push_back, erase while iterating).
    - `std::string` owns its memory vs a `char*`.
14. **Concurrency touchpoints in C/C++** (low here, belongs to the OS group)
    - Data race = UB. `volatile` is not atomic. `std::atomic` / mutex. Cross-reference only.

### 3.3 Traps and misconceptions (good distractors)
- "Arrays and pointers are the same thing" (`sizeof`, assignability, `&arr` type).
- "`sizeof(arr)` inside a function gives the array size".
- "`sizeof` of a struct is the sum of its members".
- "Signed overflow wraps around like unsigned" / "UB means the program crashes".
- "`free(p)` sets `p` to NULL" / "freeing NULL is an error" (freeing NULL is a no-op).
- "Returning a pointer to a local variable is fine if you use it right away".
- "`volatile` makes a variable thread-safe / atomic".
- "`const int *p` means p cannot change".
- "References are just pointers that can be null / reseated".
- "A destructor does not need to be virtual if the derived class has no members" (still UB via a base pointer).
- "A virtual function called in a base constructor calls the derived override".
- "`shared_ptr` prevents all leaks" (cycles).
- "`unique_ptr` can be copied".
- "`delete` on memory from `new[]` is fine" / mixing `malloc` with `delete`.
- "`char *s = "abc"; s[0] = 'x';` is valid".
- "`strlen` counts the null terminator".
- "Default copy constructor deep-copies pointed-to data".
- "`struct` in C++ cannot have methods".
- "Macros are type-safe functions" (`SQUARE(x+1)`).
- "`i = i++` has a well-defined result in all versions" (avoid deep standard-version nuance; frame as "do not rely on it").

### 3.4 Exclude
- Template metaprogramming, SFINAE, concepts, CRTP, variadic templates.
- Exact standard wording on sequence points across C++11/17 changes. Keep UB questions on clear-cut cases.
- Multiple and virtual inheritance diamond layouts, vtable layout of multiple inheritance, RTTI internals.
- Allocator classes, placement new details, custom deleters beyond "they exist".
- Compiler-specific flags, ABI details, exact padding on exotic platforms (state assumptions such as "typical 64-bit Linux" whenever a question depends on sizes).
- Memorizing which C++ standard introduced which feature.
- Obscure syntax puzzles (trigraphs, comma-operator golf, `5[arr]` as a gotcha). A single "a[i] == *(a+i)" question is enough.

---

## 4. Bit manipulation and number representation

### 4.1 Weight
- **General junior / new grad: MEDIUM-LOW.** Occasional ("single number via XOR", "power of two", "count bits"), and overflow awareness matters in any language.
- **Israeli student roles: HIGH at chip / embedded companies** (Intel, Nvidia, Apple IL, Qualcomm, Mobileye, Marvell). Reports repeatedly list bit operators, set / clear / toggle a bit, masks, endianness detection, hex <-> binary conversion, bit tricks in C. Israeli hardware interviews also blend into digital logic (outside this group). MEDIUM at other Israeli companies.

### 4.2 Concept map

1. **Binary, hex, bases**
   - Converting between binary, hex and decimal. One hex digit = 4 bits, so hex is a compact view of bits.
   - Bit numbering (LSB = bit 0), byte = 8 bits, range of an n-bit unsigned value (0 .. 2^n - 1).
2. **Two's complement**
   - Why it is used: one zero, addition circuitry works for signed and unsigned the same way.
   - Negation = invert and add 1. Range of n-bit signed: -2^(n-1) .. 2^(n-1) - 1 (asymmetric).
   - `-INT_MIN` overflows. `abs(INT_MIN)` is a trap.
   - The MSB is the sign bit. Sign extension when widening.
   - Older C standards allowed ones' complement / sign-magnitude. C23 and C++20 mandate two's complement (light touch).
3. **Bitwise operators**
   - `&`, `|`, `^`, `~`, `<<`, `>>`. Difference from the logical `&&`, `||`, `!` (short-circuit, bool result).
   - Operator precedence trap: `x & 1 == 0` parses as `x & (1 == 0)`. `a + b << 1` shifts the sum.
4. **Masks and common idioms**
   - Set bit k: `x | (1 << k)`. Clear: `x & ~(1 << k)`. Toggle: `x ^ (1 << k)`. Test: `(x >> k) & 1`.
   - Extract a field: shift then mask. Insert a field: clear then OR. (Register-style questions at Qualcomm / Intel.)
   - `x & (x - 1)` clears the lowest set bit: power-of-two test (careful with 0), Kernighan popcount in O(set bits).
   - `x & -x` isolates the lowest set bit.
   - XOR properties: `a ^ a = 0`, `a ^ 0 = a`, commutative / associative. Finding the single non-duplicated number, the missing number. XOR swap and why it fails when both refer to the same location.
   - Bitmasks as sets (subset enumeration, flags / permissions). `1 << k` with k >= 32 on an int is UB in C.
5. **Shifts**
   - Left shift by k multiplies by 2^k (if no overflow). Right shift divides by 2^k for non-negative values.
   - Logical vs arithmetic right shift. In C, right-shifting a negative signed value is implementation-defined (arithmetic on mainstream compilers). Java has `>>>`. JS has `>>>` and 32-bit coercion.
   - Shift amount >= width is UB in C/C++.
6. **Integer types and overflow**
   - Fixed widths (`int32_t`, `uint8_t`). `int` is at least 16 bits; on mainstream platforms it is 32.
   - Unsigned wraps (defined). Signed overflow is UB in C/C++. Java wraps silently. Python ints are arbitrary precision (no overflow). JS numbers are doubles (exact integers up to 2^53), and bitwise ops use 32-bit ints.
   - Integer promotion and usual arithmetic conversions: `uint8_t` arithmetic is done in `int`. Comparing signed with unsigned: `-1 < 0u` is false. `size_t` loop counting down to 0 never ends (`i >= 0` is always true).
   - Overflow-safe patterns: `lo + (hi - lo) / 2`, checking `a > INT_MAX - b` before adding, using wider types.
   - Integer division truncates toward zero in C/C++/Java (C99 onward). Python `//` floors. Modulo of negatives differs across languages.
7. **Endianness**
   - Byte order of multi-byte values in memory. Little-endian (x86, most ARM configurations) stores the LSB at the lowest address. Big-endian = "network byte order".
   - Detecting endianness by viewing an int through a `char*` / union. Why it matters: binary file formats, network protocols (`htonl`), casting byte buffers.
   - Endianness is about bytes, not bits within a byte. It does not affect values in registers or bitwise operator results.
8. **Floating point basics**
   - IEEE 754 idea: sign, exponent, mantissa. Not all decimals are representable: `0.1 + 0.2 != 0.3`. Compare with an epsilon.
   - Precision limits: float ~7 decimal digits, double ~15-16. Large doubles skip integers above 2^53 (JS `Number.MAX_SAFE_INTEGER`).
   - Special values: +/-infinity, NaN (`NaN != NaN`), signed zero. Division by zero for floats gives inf (not a crash). Integer division by zero is UB / an exception.
   - Floating-point addition is not associative: summation order changes results.
   - Never use floats for money. Casting a float to int truncates.
9. **Bits in hardware-adjacent contexts** (Israel-specific, medium)
   - Memory-mapped registers plus `volatile` plus masks. Alignment and why unaligned access can be slow or fault.
   - Bit-fields vs manual masking (portability).
   - Cache lines (64 bytes typical) as a performance idea, false sharing (name). Cross-reference to the OS / architecture group.

### 4.3 Traps and misconceptions (good distractors)
- "`~x` equals `-x`" (it is `-x - 1`).
- "`x & (x - 1) == 0` means x is a power of two" (true also for 0, plus precedence bug).
- "Right shift of a negative number always fills with zeros".
- "Endianness reverses the bits" / "endianness changes the result of `x & 0xFF`".
- "`-1 < 0u` is true in C".
- "The two's complement range is symmetric" / "`abs(INT_MIN)` is positive".
- "`0.1 + 0.2 == 0.3`" / "NaN equals itself" / "float division by zero crashes".
- "Signed overflow in C wraps to negative reliably".
- "XOR swap is always safe and faster" (aliasing; not faster on modern CPUs).
- "Python ints overflow at 2^63".
- "Hex 0x10 is ten".
- "Shifting a 32-bit int by 32 gives 0".
- "`&` and `&&` are interchangeable in conditions".

### 4.4 Exclude
- Full IEEE 754 encoding drills (manually encoding a float's exponent bias step by step), denormal details, rounding modes.
- Exotic bit hacks (De Bruijn sequences, bit-reverse tables, Gray code proofs). One "count bits" idea question is enough.
- Ones' complement / sign-magnitude arithmetic beyond a single "why two's complement" question.
- Exact compiler intrinsics names (`__builtin_popcount`) as answers.
- Digital logic design (gates, flip-flops, Verilog, metastability). Real in Israeli hardware interviews but belongs to a separate hardware track if ever added.

---

## 5. Question-writing guidance for this group

- Prefer "which fits here" scenarios ("you need the 10 most frequent words from a stream; which structure...") and "what happens if" ("what happens if you sort an already-sorted array with first-element pivot quick sort").
- Code-reading questions (5-12 lines, C or pseudocode): "what does this print", "which line has a bug", "what is the complexity". They mirror real Israeli rounds (Mobileye printed code, Check Point buggy strcat, Qualcomm C-output multiple-choice questions).
- Whenever a question depends on sizes, state the assumption ("on a typical 64-bit Linux system, int is 4 bytes, pointers are 8").
- Distractors should be the misconceptions listed in sections x.3, each plausibly held by a student who half-knows the topic.
- Explanations should give the "why" in one or two sentences. That turns the quiz into teaching.
- Keep language-neutral where possible for DS/algorithms. Use C for the C/C++ and bits topics. Use multiple languages only when the difference is the point (division, overflow, sort stability per language).

---

## 6. Sources

Israeli and company-specific (interview reports; anonymous and anecdotal):
- https://www.glassdoor.com/Interview/Intel-Corporation-Software-Engineer-Student-Interview-Questions-EI_IE1519.0,17_KO18,43.htm - Intel SWE Student (~48 reports, many Haifa). Project defense plus technical. Page content blocks scraping, only the snippet was seen. Medium quality.
- https://www.glassdoor.com/Interview/Intel-Corporation-Software-Engineer-Interview-Questions-EI_IE1519.0,17_KO18,35.htm - snippet: interviews "mainly focused on C / C++ questions and leetcode style". Medium.
- https://www.theworker.co.il/company/interviews/%D7%90%D7%99%D7%A0%D7%98%D7%9C/Intel/%D7%A1%D7%98%D7%95%D7%93%D7%A0%D7%98 - Hebrew, Intel student reports (331 total). Linked list, in-place partition, almost-sorted array, hex to binary, C clock-angle, puzzles. Good Israeli signal.
- https://www.theworker.co.il/interview/role/rev/%D7%A1%D7%98%D7%95%D7%93%D7%A0%D7%98%20(%D7%AA%D7%95%D7%9B%D7%A0%D7%94) - Hebrew, student (software) role across companies: Rafael C code review / buffer overflow, Microsoft LRU, Intel assembly-ish and puzzles. Good.
- https://www.tech-interview.co.il/ - Hebrew question bank. Categories: algorithms and DS, OS, C/C++, embedded, chip design, logic. Shows the Israeli category mix. Medium (category level only).
- https://docs.google.com/document/d/1Tpzfl0l6uX2mYVdCi8bjUZJHVuTSp-gQMBbgszGmwJU/edit - JobHunt.co.il community "1,000 questions" (Hebrew, 2020). Riddle-heavy, older. Low-medium.
- https://www.autocoder.live/guides/intel-coding-round-questions - Intel-style C/C++ output, integer promotion, UB, bit tricks, overflow-safe binary search, cache blocking. Concept list is good. Third-party prep site, not official.
- https://www.teamblind.com/post/does-intel-ask-lc-questions-if-so-how-hard-k0mfibtw - Blind: Intel has no standard process; system-software teams ask pointers, compiler teams ask algorithms. Anecdotal.
- https://www.glassdoor.de/Vorstellungsgespr%C3%A4ch/link-list-bit-operator-c-mem-layout-QTN_3709895.htm - Nvidia report: linked list, bit operators, C memory layout. Single report.
- https://www.glassdoor.com/Interview/Explain-your-project-in-detail-Difference-between-process-and-thread-How-does-virtual-memory-work-Explain-mutex-vs-semap-QTN_9088727.htm - Nvidia: project, process vs thread, virtual memory, mutex vs semaphore (OS group overlap).
- https://www.reddit.com/r/jobsearch/comments/1sgdtsk/nvidia_is_one_of_the_most_misunderstood_interview/ - Nvidia questions are domain-specific, written by interviewers, not LeetCode. Anecdotal.
- https://www.jointaro.com/interviews/companies/apple/experiences/student-software-engineer-herzliyya-april-20-2024-no-offer-negative-83e43cbb/ - Apple Herzliya student report. Small sample.
- https://www.glassdoor.com.au/Interview/Apple-Embedded-Firmware-Engineer-Interview-Questions-EI_IE1138.0,5_KO6,32.htm - Apple Herzliya embedded reports (C data-structure question).
- https://leetcode.com/discuss/post/7874360/apple-kernel-engineer-core-os-interview-lmh7t/ - Apple CoreOS: all-C round, endianness check first. US, but same company culture.
- https://www.glassdoor.com/Interview/Mobileye-Software-Engineer-Student-Interview-Questions-EI_IE413091.0,8_KO9,34.htm and https://www.glassdoor.sg/Interview/Mobileye-Interview-Questions-E413091.htm?filter.jobTitleExact=C%2B%2B+Developer - Mobileye student / C++ reports: code reading, O(1)-space string ops, DP, thread-safe queue.
- https://www.glassdoor.ca/Interview/Check-Point-Software-Technologies-Interview-E6161-RVW90206279.htm (and related Check Point reviews) - pointers / buffer overflow / buggy strcat / atoi / malloc from scratch / leak fixing.
- https://www.glassdoor.ca/Interview/RTOS-C-programming-pointers-bitwise-embedded-concepts-multithreading-processes-threads-QTN_3419121.htm - Qualcomm: C, pointers, bitwise, processes / threads.
- https://prachub.com/interview-guide/qualcomm-software-engineer-interview-questions-guide-2026 - Qualcomm guide: memcpy overlap, endianness, bit manipulation. Third-party.
- https://www.teamblind.com/post/interviews-for-embeddedfw-roles-at-hw-firms-ajy1x0g8 - embedded roles at hardware firms (Apple, Nvidia): C/C++ specifics, OS, multithreading over LeetCode.

General DS&A references (fact grounding):
- https://www.techinterviewhandbook.org/algorithms/hash-table/ and https://www.techinterviewhandbook.org/algorithms/sorting-searching/ - Tech Interview Handbook. Per-topic complexity tables, "things to look out for", corner cases. High quality, concise. Repo yangshun/tech-interview-handbook: **MIT license** (verified from LICENSE file). Paraphrase anyway.
- https://github.com/jwasham/coding-interview-university - curated study plan covering DS, Big-O, bits, C/C++ memory. **CC BY-SA 4.0** (verified). Good map of topics; share-alike if text is reused, so paraphrase only.
- https://www.bigocheatsheet.com/ - classic complexity table for DS operations and sorts. Good for fact checking. Repo ericdrowell/BigOCheatSheet license not verified (GitHub API was not available in this session): do not copy.
- https://www.geeksforgeeks.org/ (topics: stable sorting algorithms, in-place algorithms, structure member alignment and padding, two's complement, memoization vs tabulation) - broad coverage, uneven accuracy, proprietary content: use only to cross-check, never copy.
- https://en.cppreference.com/w/cpp/language/ub and https://en.cppreference.com/w/c/language/object - authoritative for UB examples, object layout and alignment. Content is dual-licensed CC BY-SA 3.0 / GFDL (per the site footer, from memory; the fetch returned 403). Use it to verify answers.
- https://medium.com/nerd-for-tech/c-interview-questions-03-bitwise-operation-size-of-struct-volatile-cfc83b39fde7 - bitwise, struct sizes, volatile. Medium quality, good for distractor ideas.
- https://dev.to/pauljlucas/c-interview-questions-4igp - C interview questions by an experienced C developer (careful about UB). Good.
- https://faceprep.in/article/must-solve-conceptual-c-programming-question/ - conceptual C (pointers, UB, sizeof). Placement-prep quality; verify claims.
- https://aticleworld.com/structure-padding-questions/ - padding / alignment question patterns. Medium.
- https://www.w3schools.com/C/c_structs_padding.php - simple padding and struct vs union sizes. Basic but correct for typical platforms.

Not reachable in this session: r/cscareerquestionsIL threads did not surface in search (Reddit Hebrew-translated r/cscareerquestions pages appeared instead); Facebook groups were not indexed. Glassdoor full pages return 403 / empty to fetchers.

---

## 7. Recommended topic list and relative question counts

Assuming a bank of about 300 questions for this group (scale proportionally). "IL-LL" = tag for the Israeli low-level / hardware track.

| # | Topic | Subtopic focus | Share | ~Questions |
|---|---|---|---|---|
| 1 | Data structures | Operation costs, which-fits-here, hashing internals, BST vs hash, heaps, linked lists, stacks / queues, graph representation, LRU design | 25% | 75 |
| 2 | Algorithms and Big-O | Code-to-complexity, hidden costs, recursion and stack depth, sorting properties, binary search invariants, BFS vs DFS, greedy vs DP, memo vs tabulation | 30% | 90 |
| 3 | C and C++ (IL-LL) | Memory layout, pointers, arrays vs pointers, malloc / free / leaks, UB, const / static / volatile, references, virtual / vtables / virtual destructor, RAII and smart pointers, padding and sizeof | 27% | 80 |
| 4 | Bits and number representation (IL-LL) | Two's complement, masks and idioms, shifts, overflow and promotion, endianness, floating point basics | 18% | 55 |

Suggested split inside each topic:
- Data structures (75): hash tables 15, arrays / dynamic arrays 8, linked lists 9, stacks / queues / deques 8, trees and BST 12, heaps 9, graphs basics 8, choose-the-structure scenarios 6.
- Algorithms (90): Big-O and code analysis 20, recursion and stack 10, sorting properties 14, binary search 10, BFS vs DFS 10, greedy vs DP 10, memo vs tabulation 6, two pointers / window / prefix-sum ideas 6, backtracking 4.
- C/C++ (80): pointers and arrays vs pointers 16, memory layout and stack vs heap 10, dynamic memory and leaks 9, UB 9, const / static / volatile / macros 9, padding / sizeof / unions 8, classes and copy semantics 6, virtual / vtables / slicing 8, RAII and smart pointers 5.
- Bits (55): masks and idioms 14, two's complement 9, overflow, promotion and cross-language integer behavior 10, shifts 6, endianness 6, floating point 7, hex / binary 3.

Difficulty mix: about 40% easy (core definitions applied), 45% medium (scenario / "what happens if"), 15% hard (combined reasoning, code reading with a subtle bug).

For users who pick an Israeli hardware company target (Intel, Nvidia, Mobileye, Apple IL, Qualcomm), weight a session roughly 35% C/C++, 25% bits, 20% DS, 20% algorithms. For product / web targets (Wix, Monday, Microsoft IL, Amdocs), roughly 40% algorithms, 40% DS, 10% C/C++ (OOP / polymorphism subset), 10% bits (overflow and floating point subset).
