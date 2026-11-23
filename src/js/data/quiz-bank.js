/**
 * Quiz question bank: multiple-choice interview questions by topic (modes/quiz.js plays them).
 * Pure data. Each question's `answer` is the index of the correct option as authored; sessions
 * shuffle the options with a seed, so authored order does not matter to players.
 */

/** @typedef {{ id: string, title: string, blurb: string }} QuizTopic */
/** @typedef {{ id: string, topic: string, level: 'easy'|'medium'|'hard', q: string, code?: string, options: string[], answer: number, why: string }} QuizQuestion */

/** @type {QuizTopic[]} */
export const QUIZ_TOPICS = [
  { id: 'oop', title: 'OOP fundamentals', blurb: 'Encapsulation, inheritance, polymorphism, abstraction.' },
  { id: 'solid', title: 'SOLID and clean code', blurb: 'The five SOLID principles, coupling, cohesion and DRY.' },
  { id: 'design-patterns', title: 'Design patterns', blurb: 'Creational, structural and behavioral patterns, plus DI.' },
  { id: 'data-structures', title: 'Data structures', blurb: 'Arrays, lists, hash maps, trees, heaps and their costs.' },
  { id: 'algorithms', title: 'Algorithms and Big-O', blurb: 'Sorting, searching, recursion, DP and graph basics.' },
  { id: 'databases', title: 'Databases and SQL', blurb: 'Joins, indexes, transactions, isolation, normalization.' },
  { id: 'networking', title: 'Networking and the web', blurb: 'HTTP, REST, TCP vs UDP, DNS, TLS, cookies and CORS.' },
  { id: 'os-concurrency', title: 'OS and concurrency', blurb: 'Processes, threads, locks, deadlock and memory.' },
  { id: 'system-design', title: 'System design basics', blurb: 'Scaling, caching, CAP, sharding, queues, consistency.' },
  { id: 'testing', title: 'Testing', blurb: 'Test levels, test doubles, TDD, coverage and flaky tests.' },
  { id: 'security', title: 'Security', blurb: 'XSS, CSRF, injection, password storage, auth and JWT.' },
  { id: 'git-devops', title: 'Git and DevOps', blurb: 'Merge vs rebase, CI/CD, containers and environments.' },
  { id: 'javascript', title: 'JavaScript', blurb: 'Closures, the event loop, this, hoisting and promises.' },
  { id: 'python', title: 'Python', blurb: 'Mutability, generators, decorators, the GIL and scoping.' },
  { id: 'java', title: 'Java', blurb: 'equals and hashCode, strings, generics, exceptions, JVM.' },
];

/** @type {QuizQuestion[]} */
export const QUIZ_QUESTIONS = [
  // ---------------------------------------------------------------- oop
  {
    id: 'oop-encapsulation', topic: 'oop', level: 'easy',
    q: 'What does encapsulation mean in object-oriented programming?',
    options: [
      'Bundling data with its methods and hiding internal state behind an interface',
      'Letting a subclass reuse and extend the fields and methods of its parent class',
      'Letting one interface have many implementations that are chosen at runtime',
      'Splitting a program into modules so that each class lives in its own source file',
    ],
    answer: 0,
    why: 'Encapsulation keeps state and behavior together and exposes only a controlled interface, so callers cannot put the object into an invalid state. Reusing parent code is inheritance; many implementations behind one interface is polymorphism.',
  },
  {
    id: 'oop-polymorphism', topic: 'oop', level: 'easy',
    q: 'A variable of type Shape holds a Circle. Calling shape.area() runs the Circle version. Which concept is this?',
    options: ['Encapsulation (information hiding)', 'Runtime polymorphism (dynamic dispatch)', 'Method overloading (compile-time dispatch)', 'Composition (has-a delegation)'],
    answer: 1,
    why: 'The method that runs is chosen by the actual object type at runtime, not the declared type. That is dynamic dispatch, the core of subtype polymorphism. Overloading is chosen at compile time from parameter types.',
  },
  {
    id: 'oop-abstraction', topic: 'oop', level: 'easy',
    q: 'Which statement best describes abstraction?',
    options: [
      'Making every field private and exposing getters and setters',
      'Creating many objects from a single class',
      'Exposing what an object does while hiding how it does it',
      'Copying behavior from a base class into a subclass',
    ],
    answer: 2,
    why: 'Abstraction models the essential behavior (for example, a List you can add to and iterate) and hides implementation details. Private fields are one tool for encapsulation, which supports abstraction but is not the same idea.',
  },
  {
    id: 'oop-overload-vs-override', topic: 'oop', level: 'medium',
    q: 'What is the difference between method overloading and method overriding?',
    options: [
      'Overloading: a subclass redefines an inherited method. Overriding: same name, different parameters',
      'Overloading is resolved at runtime; overriding is always resolved at compile time',
      'They are synonyms; both describe redefining a method in a subclass',
      'Overloading: same name, different parameters. Overriding: a subclass redefines an inherited method',
    ],
    answer: 3,
    why: 'Overloading means several methods share a name but differ in parameters, and the compiler picks one. Overriding means a subclass provides its own version of an inherited method with the same signature, picked at runtime.',
  },
  {
    id: 'oop-composition-over-inheritance', topic: 'oop', level: 'medium',
    q: 'Why do many designers prefer composition over inheritance?',
    options: [
      'It couples classes less tightly and lets behavior be swapped at runtime',
      'It always runs faster because it avoids virtual method calls entirely',
      'Most modern languages no longer support class inheritance',
      'It lets a class read and write the private fields of the objects it holds',
    ],
    answer: 0,
    why: 'Inheritance ties a subclass to its parent\'s implementation details (the fragile base class problem). Holding collaborators as fields keeps coupling to their interfaces and allows swapping them, for example via dependency injection.',
  },
  {
    id: 'oop-diamond-problem', topic: 'oop', level: 'medium',
    q: 'What is the "diamond problem" in multiple inheritance?',
    options: [
      'A rule that a class may not have more than two parent classes in its hierarchy',
      'Ambiguity when a class inherits one member through two parents sharing a base',
      'Two classes import each other and cannot be compiled',
      'Two sibling subclasses override the same inherited method in different ways',
    ],
    answer: 1,
    why: 'If B and C both extend A and D extends B and C, a call to an A method on D is ambiguous: via B or via C. Languages resolve it differently: C++ virtual inheritance, Python MRO, Java allows only one superclass.',
  },
  {
    id: 'oop-abstract-vs-interface', topic: 'oop', level: 'medium',
    q: 'In general OOP terms, what can an abstract class have that a classic interface cannot?',
    options: [
      'Abstract method signatures without bodies',
      'More than one implementing or extending class',
      'Instance state (fields) and constructors',
      'Public methods',
    ],
    answer: 2,
    why: 'An abstract class can hold per-instance fields and constructors that subclasses reuse. An interface describes a contract; even where interfaces gained default methods (Java 8+), they still cannot hold instance state.',
  },
  {
    id: 'oop-static-method', topic: 'oop', level: 'medium',
    q: 'Which statement about a static method is true?',
    options: [
      'It can be overridden polymorphically by subclasses',
      'A separate copy of it is stored in every instance',
      'It can read the instance fields directly through this',
      'It belongs to the class and runs without an instance',
    ],
    answer: 3,
    why: 'A static method is attached to the class, has no this, and so cannot touch instance fields without an object reference. In Java, a same-named static method in a subclass hides the parent one; it does not override it.',
  },
  {
    id: 'oop-virtual-call-in-constructor', topic: 'oop', level: 'hard',
    q: 'In Java, a base class constructor calls an overridable method that a subclass overrides. What happens when you construct the subclass?',
    options: [
      'The subclass version runs before the subclass fields are initialized',
      'The base class version always runs during construction',
      'The code does not compile',
      'The subclass version runs after the subclass fields are initialized',
    ],
    answer: 0,
    why: 'Java dispatches dynamically even inside constructors, but the subclass field initializers run only after super() returns. The override therefore sees default values (null, 0). C++ differs: there the base version runs.',
  },
  {
    id: 'oop-covariant-return', topic: 'oop', level: 'hard',
    q: 'When overriding a method, which change keeps the subclass type-safe for existing callers?',
    options: [
      'Narrowing a parameter type, for example from Animal to Dog',
      'Narrowing the return type, for example from Animal to Dog',
      'Widening the return type, for example from Dog to Animal',
      'Throwing a new checked exception the parent did not declare',
    ],
    answer: 1,
    why: 'Callers expecting an Animal are fine receiving a Dog, so covariant returns are safe. Narrowing a parameter would reject arguments the parent accepted, and new checked exceptions would surprise callers of the parent type.',
  },

  // ---------------------------------------------------------------- solid
  {
    id: 'solid-srp', topic: 'solid', level: 'easy',
    q: 'The Single Responsibility Principle says a class should:',
    options: [
      'have only one public method',
      'have only one reason to change',
      'never depend on another class',
      'be instantiated only once',
    ],
    answer: 1,
    why: 'SRP is about cohesion around one concern or one stakeholder, so a change in, say, report formatting does not touch billing logic. It does not limit the number of methods; having one instance is the Singleton pattern.',
  },
  {
    id: 'solid-ocp', topic: 'solid', level: 'easy',
    q: 'The Open/Closed Principle says software entities should be:',
    options: [
      'open to modification but closed to extension',
      'open source but closed to outside contributors',
      'open for extension but closed for modification',
      'open to all callers, with no private members',
    ],
    answer: 2,
    why: 'You should be able to add new behavior (a new subclass, strategy or plugin) without editing tested existing code. The first option reverses the principle.',
  },
  {
    id: 'solid-dip', topic: 'solid', level: 'medium',
    q: 'What does the Dependency Inversion Principle recommend?',
    options: [
      'Low-level modules should define the interfaces that high-level modules call',
      'Each class should create its dependencies internally with new',
      'Inheritance should replace interfaces wherever possible',
      'High-level and low-level modules should both depend on abstractions',
    ],
    answer: 3,
    why: 'Business logic should not depend on concrete details like a specific database driver. Both sides depend on an abstraction, typically owned by the high-level module, so details can be replaced without touching the policy.',
  },
  {
    id: 'solid-lsp-square', topic: 'solid', level: 'medium',
    q: 'Square extends Rectangle, and setWidth also changes the height. Code that sets width 5 and height 4 then expects area 20 breaks. Which principle is violated?',
    options: ['Liskov Substitution', 'Interface Segregation', 'Single Responsibility', 'Open/Closed'],
    answer: 0,
    why: 'Liskov Substitution requires a subtype to be usable anywhere its base type is expected without breaking callers. A Square cannot honor the Rectangle contract that width and height change independently.',
  },
  {
    id: 'solid-isp', topic: 'solid', level: 'easy',
    q: 'Which principle says clients should not be forced to depend on methods they do not use?',
    options: ['Single Responsibility', 'Interface Segregation', 'Open/Closed', 'Dependency Inversion'],
    answer: 1,
    why: 'Interface Segregation favors several small, focused interfaces over one large one, so a simple printer does not have to implement fax() and scan() just to satisfy a fat interface.',
  },
  {
    id: 'solid-coupling-cohesion', topic: 'solid', level: 'medium',
    q: 'Which combination usually indicates a well designed module?',
    options: [
      'High coupling and high cohesion',
      'Low coupling and low cohesion',
      'Low coupling and high cohesion',
      'High coupling and low cohesion',
    ],
    answer: 2,
    why: 'High cohesion means the parts of a module belong together; low coupling means it depends little on other modules\' internals. Together they keep changes local and modules easy to test and replace.',
  },
  {
    id: 'solid-dry', topic: 'solid', level: 'medium',
    q: 'What is DRY (Don\'t Repeat Yourself) really about?',
    options: [
      'Merging any two blocks of code that look similar into one helper',
      'Keeping function and variable names short and free of repetition',
      'Never writing comments that restate the code',
      'Giving each business rule or piece of knowledge a single home',
    ],
    answer: 3,
    why: 'DRY targets duplicated knowledge: if a tax rule lives in two places, they will drift. Two snippets that merely look alike but encode different rules can be fine as they are; merging them creates false coupling.',
  },
  {
    id: 'solid-ocp-strategy', topic: 'solid', level: 'medium',
    q: 'A switch on paymentType grows every time a new payment method is added. Which change best applies the Open/Closed Principle?',
    options: [
      'One class per payment method behind a PaymentMethod interface, looked up by key',
      'Move the same switch statement into a separate shared utility module for reuse',
      'Replace the switch with an equivalent if/else chain over the payment type',
      'Add a default branch to the switch that throws for unknown payment types',
    ],
    answer: 0,
    why: 'With polymorphism, adding a payment method means adding a new class and registering it, without editing existing code. Moving or rewriting the switch still requires modifying it for every new type.',
  },
  {
    id: 'solid-dip-vs-di', topic: 'solid', level: 'hard',
    q: 'How do the Dependency Inversion Principle (DIP) and Dependency Injection (DI) relate?',
    options: [
      'They are two names for exactly the same design principle',
      'DI is one technique for applying DIP; DIP is about dependency direction',
      'DIP is a feature of DI frameworks, while DI is the underlying design principle',
      'DI requires a container, and DIP forbids using containers',
    ],
    answer: 1,
    why: 'DIP is a design rule: depend on abstractions, not concretions. DI is a mechanism: pass collaborators in from outside, by hand or with a container. You can inject concrete classes and still violate DIP.',
  },
  {
    id: 'solid-lsp-contracts', topic: 'solid', level: 'hard',
    q: 'Under the Liskov Substitution Principle, how may an overriding method change its contract?',
    options: [
      'It may strengthen preconditions and weaken postconditions',
      'It may change both freely as long as the signature matches',
      'It may weaken preconditions and strengthen postconditions',
      'It may not change preconditions or postconditions in any way',
    ],
    answer: 2,
    why: 'A subtype may accept more inputs (weaker preconditions) and promise more about results (stronger postconditions); callers written for the base type still work. Demanding more or promising less breaks them.',
  },

  // ---------------------------------------------------------------- design-patterns
  {
    id: 'design-patterns-singleton', topic: 'design-patterns', level: 'easy',
    q: 'What does the Singleton pattern guarantee?',
    options: [
      'A class can never be subclassed or extended by other classes',
      'Objects are created only through a factory method',
      'A class has exactly one instance with a global access point',
      'An object cannot be modified after it is created',
    ],
    answer: 2,
    why: 'Singleton restricts a class to one instance and provides a way to reach it. Preventing modification is immutability, and restricting creation to a method is the Factory Method idea.',
  },
  {
    id: 'design-patterns-observer', topic: 'design-patterns', level: 'easy',
    q: 'When a spreadsheet cell changes, every chart that depends on it must update. Which pattern fits?',
    options: ['Adapter', 'Decorator', 'Builder', 'Observer'],
    answer: 3,
    why: 'Observer lets a subject keep a list of subscribers and notify them on change, without knowing their concrete types. It is the basis of event listeners and pub/sub.',
  },
  {
    id: 'design-patterns-adapter', topic: 'design-patterns', level: 'easy',
    q: 'You must use a third-party logger whose interface differs from the one your code expects. Which pattern converts one interface into another?',
    options: ['Adapter', 'Facade', 'Proxy', 'Composite'],
    answer: 0,
    why: 'An Adapter wraps an object and translates calls to the interface clients expect. A Facade offers a simpler interface over a whole subsystem; a Proxy keeps the same interface to control access.',
  },
  {
    id: 'design-patterns-strategy', topic: 'design-patterns', level: 'medium',
    q: 'A shipping calculator must switch between several pricing algorithms at runtime. Which pattern fits best?',
    options: ['Singleton', 'Strategy', 'Template Method', 'Prototype'],
    answer: 1,
    why: 'Strategy puts each algorithm behind a common interface and lets the context hold and swap one at runtime. Template Method varies steps through subclassing, which is fixed when the object is created.',
  },
  {
    id: 'design-patterns-decorator', topic: 'design-patterns', level: 'medium',
    q: 'Which pattern adds responsibilities to an object by wrapping it in another object with the same interface?',
    options: ['Adapter', 'Factory Method', 'Decorator', 'Visitor'],
    answer: 2,
    why: 'A Decorator implements the same interface as the wrapped object and adds behavior before or after delegating, for example buffering around a stream. Decorators can be stacked. An Adapter changes the interface instead.',
  },
  {
    id: 'design-patterns-builder', topic: 'design-patterns', level: 'medium',
    q: 'When is the Builder pattern most useful?',
    options: [
      'When a class must have only one instance shared by the whole app',
      'When two incompatible interfaces must work together',
      'When many objects must be notified of a change',
      'When building an object with many optional parts step by step',
    ],
    answer: 3,
    why: 'Builder avoids telescoping constructors with long parameter lists by setting parts through named steps and producing the final, often immutable, object at the end. The other options describe Singleton, Adapter and Observer.',
  },
  {
    id: 'design-patterns-dependency-injection', topic: 'design-patterns', level: 'medium',
    q: 'What is the main benefit of dependency injection?',
    options: [
      'Classes get collaborators from outside, so tests can swap in fakes',
      'Objects are created faster because a container caches them',
      'It removes the need for interfaces in statically typed languages',
      'It guarantees that every dependency is created once as a singleton',
    ],
    answer: 0,
    why: 'When a class gets its dependencies through its constructor or parameters instead of creating them, you can pass a fake in tests or another implementation in production. Lifetimes like singleton are a separate choice.',
  },
  {
    id: 'design-patterns-repository', topic: 'design-patterns', level: 'medium',
    q: 'What does the Repository pattern provide?',
    options: [
      'A cache placed in front of every HTTP request',
      'A collection-like API for domain objects that hides data access',
      'A version history for database schema changes',
      'A way to clone objects without knowing their concrete class or constructor',
    ],
    answer: 1,
    why: 'A repository exposes methods like findById or save in domain terms and hides SQL, ORM or API details. Business logic can then be tested with an in-memory repository. Cloning objects is the Prototype pattern.',
  },
  {
    id: 'design-patterns-abstract-factory', topic: 'design-patterns', level: 'hard',
    q: 'How does Abstract Factory differ from Factory Method?',
    options: [
      'Abstract Factory always returns singletons, while Factory Method returns new objects',
      'Factory Method creates families of objects; Abstract Factory creates a single product',
      'Abstract Factory builds families of related objects; Factory Method defers one product',
      'They differ only in name; their structure is identical',
    ],
    answer: 2,
    why: 'Abstract Factory is an object with several creation methods for a consistent family, such as buttons and menus for one UI theme. Factory Method is a single overridable method that defers one creation decision to subclasses.',
  },
  {
    id: 'design-patterns-singleton-drawbacks', topic: 'design-patterns', level: 'hard',
    q: 'Why is Singleton often criticized as an anti-pattern?',
    options: [
      'It uses noticeably more memory than a normal class with the same fields',
      'It cannot be implemented in garbage-collected languages',
      'It always causes deadlocks in multithreaded programs',
      'It adds hidden global state, which makes code harder to test',
    ],
    answer: 3,
    why: 'Code that reaches for a global instance hides its dependencies, shares mutable state across tests and is hard to replace with a fake. Injecting a single shared instance gives the same lifetime without these problems.',
  },

  // ---------------------------------------------------------------- data-structures
  {
    id: 'data-structures-array-access', topic: 'data-structures', level: 'easy',
    q: 'What is the time complexity of reading arr[i] from an array?',
    options: ['O(log n)', 'O(n)', 'O(n log n)', 'O(1)'],
    answer: 3,
    why: 'Array elements sit in contiguous memory, so the address of element i is base + i * size, computed in constant time. That random access is what linked lists lack.',
  },
  {
    id: 'data-structures-hash-average', topic: 'data-structures', level: 'easy',
    q: 'What is the average-case time for a lookup in a hash table with a good hash function?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    answer: 0,
    why: 'The hash maps a key straight to a bucket, and with a good hash and a bounded load factor each bucket holds few entries, so lookups take constant time on average.',
  },
  {
    id: 'data-structures-lifo', topic: 'data-structures', level: 'easy',
    q: 'Which structure processes items in last-in, first-out (LIFO) order?',
    options: ['Queue', 'Stack', 'Min-heap', 'Priority queue'],
    answer: 1,
    why: 'A stack pushes and pops at the same end, so the newest item comes out first. A queue is FIFO, and heaps or priority queues order items by priority, not arrival.',
  },
  {
    id: 'data-structures-linked-list-insert', topic: 'data-structures', level: 'medium',
    q: 'You already hold a reference to a node in a singly linked list. What does inserting a new node right after it cost?',
    options: ['O(n)', 'O(log n)', 'O(1)', 'O(n^2)'],
    answer: 2,
    why: 'You only rewire two pointers: new.next = node.next and node.next = new. The O(n) cost of linked lists comes from finding the position, which is already done here.',
  },
  {
    id: 'data-structures-heap-ops', topic: 'data-structures', level: 'medium',
    q: 'In a binary min-heap with n elements, what are the costs of peeking at the minimum and of extracting it?',
    options: ['O(log n) and O(1)', 'O(1) and O(1)', 'O(n) and O(log n)', 'O(1) and O(log n)'],
    answer: 3,
    why: 'The minimum is always at the root, so peeking is O(1). Extracting it moves the last element to the root and sifts it down the tree height, which is O(log n).',
  },
  {
    id: 'data-structures-bst-worst', topic: 'data-structures', level: 'medium',
    q: 'What is the worst-case search time in a binary search tree that is not self-balancing?',
    options: ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'],
    answer: 0,
    why: 'Inserting sorted keys builds a tree that is effectively a linked list, with height n. Self-balancing trees such as AVL or red-black trees keep the height O(log n).',
  },
  {
    id: 'data-structures-hash-worst', topic: 'data-structures', level: 'medium',
    q: 'Why can hash table lookups degrade to O(n)?',
    options: [
      'Because keys must be sorted before each lookup',
      'Because many keys can collide into the same bucket',
      'Because the table is resized on every insert',
      'Because hashing a key costs time proportional to the table size',
    ],
    answer: 1,
    why: 'If many keys hash to one bucket (a weak hash or adversarial input), a lookup scans all of them. Resizing is occasional and amortized, and the hash cost depends on the key, not the table size.',
  },
  {
    id: 'data-structures-dynamic-array-append', topic: 'data-structures', level: 'medium',
    q: 'A dynamic array (such as ArrayList or a Python list) doubles its capacity when full. What does an append cost?',
    options: ['O(n) every time', 'O(log n) amortized', 'O(1) amortized', 'O(1) in the worst case'],
    answer: 2,
    why: 'Most appends write into spare capacity. An occasional resize copies n items, but doubling makes the total copy work over n appends O(n), so each append is O(1) amortized. A single append can still be O(n).',
  },
  {
    id: 'data-structures-trie-lookup', topic: 'data-structures', level: 'hard',
    q: 'What is the time to look up a word of length L in a trie that holds n words?',
    options: ['O(n)', 'O(log n)', 'O(n * L)', 'O(L)'],
    answer: 3,
    why: 'A trie walks one node per character, so lookup depends on the word length, not the number of stored words. That makes tries good for prefix search and autocomplete.',
  },
  {
    id: 'data-structures-lru-cache', topic: 'data-structures', level: 'hard',
    q: 'Which combination gives O(1) get and put for an LRU cache?',
    options: [
      'A hash map plus a doubly linked list',
      'A binary search tree plus a stack',
      'A min-heap keyed by last access time',
      'A sorted array searched with binary search',
    ],
    answer: 0,
    why: 'The hash map finds a node in O(1); the doubly linked list moves it to the front and evicts from the tail in O(1). A heap would make each access update O(log n).',
  },

  // ---------------------------------------------------------------- algorithms
  {
    id: 'algorithms-binary-search-precondition', topic: 'algorithms', level: 'easy',
    q: 'What must be true of an array for binary search to work?',
    options: [
      'It must be sorted',
      'It must contain no duplicate values',
      'It must fit in a hash table',
      'Its length must be a power of two',
    ],
    answer: 0,
    why: 'Binary search discards half the range after each comparison, which is only valid if order tells you which half can contain the target. Duplicates and any length are fine.',
  },
  {
    id: 'algorithms-merge-sort-complexity', topic: 'algorithms', level: 'easy',
    q: 'What is the worst-case time complexity of merge sort?',
    options: ['O(n^2)', 'O(n log n)', 'O(n)', 'O(log n)'],
    answer: 1,
    why: 'Merge sort always splits in half (log n levels) and merges each level in O(n), giving O(n log n) in every case. Its usual trade-off is O(n) extra memory for arrays.',
  },
  {
    id: 'algorithms-quicksort-worst', topic: 'algorithms', level: 'medium',
    q: 'Quicksort always picks the first element as its pivot. Which input triggers its O(n^2) worst case?',
    options: [
      'An array where all elements are distinct',
      'An array of odd length',
      'An array that is already sorted',
      'An array with fewer than 10 elements',
    ],
    answer: 2,
    why: 'On sorted input the first element is the smallest, so each partition peels off one element and recursion depth becomes n. Random or median-of-three pivots make this case unlikely.',
  },
  {
    id: 'algorithms-nested-loop-complexity', topic: 'algorithms', level: 'medium',
    q: 'What is the time complexity of this code?',
    code: `for (let i = 1; i < n; i *= 2) {
  for (let j = 0; j < n; j++) {
    work(); // O(1)
  }
}`,
    options: ['O(n)', 'O(n^2)', 'O(log n)', 'O(n log n)'],
    answer: 3,
    why: 'The outer loop doubles i, so it runs about log2(n) times. The inner loop runs n times for each outer pass, giving O(n log n). It would be O(n^2) only if i grew by 1.',
  },
  {
    id: 'algorithms-bfs-shortest-path', topic: 'algorithms', level: 'easy',
    q: 'Which algorithm finds the shortest path by number of edges in an unweighted graph?',
    options: ['Breadth-first search', 'Depth-first search', 'Kruskal\'s algorithm', 'Topological sort'],
    answer: 0,
    why: 'BFS explores in layers of distance 1, 2, 3 and so on, so the first time it reaches a node is along a shortest path. DFS can reach a node through a long path first. Kruskal builds a minimum spanning tree.',
  },
  {
    id: 'algorithms-dijkstra-negative', topic: 'algorithms', level: 'medium',
    q: 'On which graphs can Dijkstra\'s algorithm return wrong shortest paths?',
    options: [
      'Graphs that contain cycles',
      'Graphs with negative edge weights',
      'Directed graphs',
      'Graphs with more edges than nodes',
    ],
    answer: 1,
    why: 'Dijkstra finalizes the closest unvisited node, assuming later edges cannot make its distance shorter. A negative edge breaks that assumption. Bellman-Ford handles negative weights and detects negative cycles.',
  },
  {
    id: 'algorithms-dp-properties', topic: 'algorithms', level: 'medium',
    q: 'Which two properties make a problem a good fit for dynamic programming?',
    options: [
      'Sorted input and unique values',
      'A greedy choice property and an acyclic graph',
      'Overlapping subproblems and optimal substructure',
      'Shallow recursion and integer-only inputs',
    ],
    answer: 2,
    why: 'Optimal substructure means an optimal answer is built from optimal answers to subproblems; overlapping subproblems means they repeat, so caching them (memoization or tabulation) saves work.',
  },
  {
    id: 'algorithms-naive-fibonacci', topic: 'algorithms', level: 'medium',
    q: 'What is the time complexity of this naive recursive Fibonacci?',
    code: `function fib(n) {
  if (n < 2) return n;
  return fib(n - 1) + fib(n - 2);
}`,
    options: ['O(n)', 'O(n log n)', 'O(n^2)', 'O(2^n)'],
    answer: 3,
    why: 'Each call branches into two more and the same values are recomputed many times, so the call tree grows exponentially (about 1.6^n, bounded by O(2^n)). Memoization brings it down to O(n).',
  },
  {
    id: 'algorithms-stable-sort', topic: 'algorithms', level: 'hard',
    q: 'Which of these sorting algorithms is stable in its standard array form?',
    options: ['Merge sort', 'Quicksort', 'Heapsort', 'Selection sort'],
    answer: 0,
    why: 'A stable sort keeps equal keys in their original order. Merge sort does, as long as the merge takes from the left half on ties. Standard quicksort, heapsort and selection sort swap elements across long distances and are not stable.',
  },
  {
    id: 'algorithms-comparison-sort-bound', topic: 'algorithms', level: 'hard',
    q: 'What is the worst-case lower bound for any comparison-based sorting algorithm?',
    options: ['Ω(n)', 'Ω(n log n)', 'Ω(n^2)', 'Ω(log n)'],
    answer: 1,
    why: 'A comparison sort must distinguish n factorial orderings, and a binary decision tree with that many leaves has height at least log2(n factorial), which is Θ(n log n). Counting and radix sort beat it by not comparing elements.',
  },

  // ---------------------------------------------------------------- databases
  {
    id: 'databases-left-join', topic: 'databases', level: 'easy',
    q: 'What does a LEFT JOIN return that an INNER JOIN does not?',
    options: [
      'Right table rows that have no match in the left table, with NULLs on the left',
      'Left rows with no match, with NULLs in the right table\'s columns',
      'Only the rows whose join key is NULL on both sides',
      'The same rows with duplicates removed',
    ],
    answer: 1,
    why: 'An INNER JOIN keeps only matching pairs. A LEFT JOIN keeps every left row and fills the right side with NULL when nothing matches. Unmatched right rows come from a RIGHT or FULL OUTER JOIN.',
  },
  {
    id: 'databases-sql-vs-nosql', topic: 'databases', level: 'easy',
    q: 'When is a document store (such as MongoDB) often a better fit than a relational database?',
    options: [
      'When many transactions must span several tables with strict constraints',
      'When reports need complex ad hoc joins across many entities',
      'When records vary in shape and are usually read as one self-contained document',
      'When the dataset is small enough to fit in memory',
    ],
    answer: 2,
    why: 'Document stores shine with flexible schemas and access patterns that fetch a whole aggregate at once. Heavy joins, multi-table constraints and complex transactions are where relational databases are strongest.',
  },
  {
    id: 'databases-acid-atomicity', topic: 'databases', level: 'easy',
    q: 'In ACID, what does atomicity guarantee?',
    options: [
      'Concurrent transactions do not see each other\'s uncommitted changes',
      'Committed data survives a crash',
      'Data always satisfies the declared constraints',
      'A transaction is applied entirely or not at all',
    ],
    answer: 3,
    why: 'Atomicity means all-or-nothing: if a transfer debits one account and then fails, the debit is rolled back. The other options describe isolation, durability and consistency.',
  },
  {
    id: 'databases-index-cost', topic: 'databases', level: 'medium',
    q: 'What is the main cost of adding an index to a table?',
    options: [
      'Slower writes and extra storage, since the index must be maintained',
      'Slower reads on the indexed column because the planner checks the index first',
      'A full table lock on every SELECT',
      'The column can no longer hold duplicate values',
    ],
    answer: 0,
    why: 'Every INSERT, UPDATE or DELETE must also update each index, and the index takes disk and memory. Reads usually get faster. Only a UNIQUE index forbids duplicates.',
  },
  {
    id: 'databases-having-vs-where', topic: 'databases', level: 'medium',
    q: 'Why does this query filter with HAVING instead of WHERE?',
    code: `SELECT dept, COUNT(*)
FROM employees
GROUP BY dept
HAVING COUNT(*) > 5;`,
    options: [
      'HAVING is faster than WHERE on large tables because it runs later',
      'WHERE filters rows before grouping, so it cannot test COUNT(*)',
      'WHERE cannot be used in a query that has GROUP BY',
      'HAVING is required whenever SELECT lists more than one column',
    ],
    answer: 1,
    why: 'WHERE filters individual rows before GROUP BY; HAVING filters groups after aggregation. WHERE and GROUP BY can be combined freely, for example to drop rows before counting.',
  },
  {
    id: 'databases-null-equality', topic: 'databases', level: 'medium',
    q: 'In standard SQL, the users table has 3 rows whose email is NULL. What does this query return?',
    code: `SELECT COUNT(*) FROM users WHERE email = NULL;`,
    options: ['3', 'NULL', '0', 'A syntax error'],
    answer: 2,
    why: 'Any comparison with NULL using = yields UNKNOWN, not TRUE, so no row passes the filter and COUNT(*) is 0. Use WHERE email IS NULL to find missing values.',
  },
  {
    id: 'databases-dirty-read', topic: 'databases', level: 'medium',
    q: 'Which isolation level still allows dirty reads (seeing another transaction\'s uncommitted changes)?',
    options: ['Read Committed', 'Repeatable Read', 'Serializable', 'Read Uncommitted'],
    answer: 3,
    why: 'Read Uncommitted is the only standard level that permits dirty reads. Read Committed and above only show committed data.',
  },
  {
    id: 'databases-normalization', topic: 'databases', level: 'medium',
    q: 'An orders table repeats customer_name and customer_city on every order row. What problem does normalizing this into a customers table fix?',
    options: [
      'Update anomalies: one city change must be made on many rows',
      'Slow lookups by primary key once the orders table grows large',
      'The database rejecting foreign keys on wide tables',
      'Queries that need ORDER BY on the customer name column',
    ],
    answer: 0,
    why: 'Storing the same fact in many rows risks inconsistent copies when one row is updated and others are not. Normalization stores each fact once and references it by key.',
  },
  {
    id: 'databases-composite-index', topic: 'databases', level: 'hard',
    q: 'A B-tree index exists on (last_name, first_name). Under the leftmost-prefix rule, which filter can use it for an index seek?',
    options: [
      "WHERE first_name = 'Ana'",
      "WHERE last_name = 'Lee'",
      "WHERE first_name LIKE '%na'",
      "WHERE UPPER(last_name) = 'LEE'",
    ],
    answer: 1,
    why: 'The index is sorted by last_name first, so a seek needs a condition on the leading column. Filtering only on first_name, a leading wildcard, or a function on the column (without a matching expression index) prevents a seek.',
  },
  {
    id: 'databases-phantom-read', topic: 'databases', level: 'hard',
    q: 'Under Repeatable Read as defined by the SQL standard, which anomaly is still permitted?',
    options: ['Dirty reads', 'Non-repeatable reads', 'Phantom reads', 'Lost committed writes after a crash'],
    answer: 2,
    why: 'The standard lets Repeatable Read show new rows that match a re-run range query (phantoms); only Serializable rules them out. Some engines, such as PostgreSQL with snapshot isolation, prevent phantoms at this level anyway.',
  },

  // ---------------------------------------------------------------- networking
  {
    id: 'networking-idempotent-not-safe', topic: 'networking', level: 'medium',
    q: 'Which HTTP method is idempotent but not safe?',
    options: ['GET', 'POST', 'PUT', 'HEAD'],
    answer: 2,
    why: 'PUT changes server state (not safe), but repeating the same PUT leaves the same result (idempotent). GET and HEAD are safe and idempotent; POST is neither by definition.',
  },
  {
    id: 'networking-401', topic: 'networking', level: 'easy',
    q: 'A request with no credentials reaches an endpoint that requires login. Which status code fits best?',
    options: ['403 Forbidden', '404 Not Found', '400 Bad Request', '401 Unauthorized'],
    answer: 3,
    why: '401 means the client is not authenticated and should supply credentials. 403 means the server knows who you are but you are not allowed. Despite its name, 401 is about authentication.',
  },
  {
    id: 'networking-tcp-vs-udp', topic: 'networking', level: 'easy',
    q: 'Which is true of UDP compared with TCP?',
    options: [
      'It has no built-in delivery or ordering guarantees',
      'It always encrypts the traffic it carries',
      'It starts every connection with a three-way handshake',
      'It can only be used inside a data center',
    ],
    answer: 0,
    why: 'UDP sends independent datagrams with no handshake, retransmission or ordering, which keeps latency low for games, voice and DNS. TCP provides reliable, ordered streams. Neither encrypts by itself.',
  },
  {
    id: 'networking-dns', topic: 'networking', level: 'easy',
    q: 'What does DNS do?',
    options: [
      'Encrypts traffic between the browser and the server',
      'Resolves domain names to IP addresses',
      'Assigns IP addresses to devices on a local network',
      'Routes packets between internet providers',
    ],
    answer: 1,
    why: 'DNS translates names like example.com into IP addresses. Assigning local addresses is DHCP, encryption is TLS, and routing between providers is BGP.',
  },
  {
    id: 'networking-cors', topic: 'networking', level: 'medium',
    q: 'What does CORS control?',
    options: [
      'Whether a server accepts TCP connections from other countries',
      'Whether cookies are encrypted while they travel between client and server',
      'Whether a browser lets a page read responses from another origin',
      'Whether one backend server may call another backend server',
    ],
    answer: 2,
    why: 'CORS relaxes the browser\'s same-origin policy: the server sends headers like Access-Control-Allow-Origin to say which origins may read its responses. It is enforced by browsers, so server-to-server calls are unaffected.',
  },
  {
    id: 'networking-rest-stateless', topic: 'networking', level: 'medium',
    q: 'In REST, what does "stateless" mean?',
    options: [
      'The server never stores anything in a database or on disk between requests',
      'Responses must never be cached by clients, proxies or CDNs',
      'Clients are not allowed to send cookies or any other headers that identify them',
      'Each request is self-contained; the server keeps no client session between them',
    ],
    answer: 3,
    why: 'Statelessness is about client session state: each request is self-contained (for example, it carries a token), so any server instance can handle it. Resources are still persisted, and caching is encouraged.',
  },
  {
    id: 'networking-tls-certificate', topic: 'networking', level: 'medium',
    q: 'During a TLS handshake, what is the server\'s certificate mainly used for?',
    options: [
      'Proving the server owns the domain, so the client can trust its key',
      'Compressing the data sent over the connection',
      'Encrypting all application data with the server\'s public key for the session',
      'Choosing which HTTP version to use',
    ],
    answer: 0,
    why: 'A certificate signed by a trusted CA binds the domain to a public key, which authenticates the key exchange. Bulk data is then encrypted with symmetric session keys, which is much faster than public-key encryption.',
  },
  {
    id: 'networking-httponly-cookie', topic: 'networking', level: 'medium',
    q: 'What does the HttpOnly flag on a cookie do?',
    options: [
      'Sends the cookie only over plain HTTP and never over HTTPS',
      'Prevents JavaScript on the page from reading the cookie',
      'Blocks the cookie on cross-site requests',
      'Deletes the cookie when the tab closes',
    ],
    answer: 1,
    why: 'HttpOnly hides the cookie from document.cookie, which limits session theft through XSS. HTTPS-only sending is the Secure flag, and cross-site control is SameSite.',
  },
  {
    id: 'networking-cors-preflight', topic: 'networking', level: 'hard',
    q: 'Which cross-origin fetch makes the browser send a CORS preflight OPTIONS request first?',
    options: [
      'A GET with no custom headers',
      'A POST with Content-Type: application/x-www-form-urlencoded',
      'A PUT with Content-Type: application/json',
      'A HEAD with no custom headers',
    ],
    answer: 2,
    why: 'Only "simple" requests skip the preflight: GET, HEAD or POST with safe headers and a form or text content type. PUT is not a simple method, and application/json is not a simple content type either.',
  },
  {
    id: 'networking-http3', topic: 'networking', level: 'hard',
    q: 'What problem does HTTP/3 (over QUIC) solve that HTTP/2 over TCP still has?',
    options: [
      'Repeated headers that HTTP/2 sends uncompressed on every request',
      'Only one request in flight per connection at any given time',
      'No encryption by default',
      'TCP head-of-line blocking: one lost packet stalls every stream',
    ],
    answer: 3,
    why: 'HTTP/2 multiplexes streams over one TCP connection, so a lost packet delays all streams until it is retransmitted. QUIC runs over UDP and handles loss per stream. HTTP/2 already had header compression and multiplexing.',
  },

  // ---------------------------------------------------------------- os-concurrency
  {
    id: 'os-concurrency-process-vs-thread', topic: 'os-concurrency', level: 'easy',
    q: 'What is a key difference between processes and threads?',
    options: [
      'Threads of one process cannot run in parallel on a multicore CPU',
      'Processes share memory by default, while threads each get private memory',
      'A process can contain only one thread, so each new thread needs a new process',
      'Threads share their process memory; processes get separate address spaces',
    ],
    answer: 3,
    why: 'Threads in one process share the heap and globals, which makes communication cheap but needs synchronization. Processes are isolated by the OS and must use IPC to share data.',
  },
  {
    id: 'os-concurrency-race-condition', topic: 'os-concurrency', level: 'easy',
    q: 'Two threads each run counter++ 1000 times on a shared variable with no lock. The result is sometimes below 2000. Why?',
    options: [
      'counter++ is read-modify-write, so concurrent updates can be lost',
      'The CPU cache silently drops writes once the value grows past 1000',
      'Threads are not allowed to write variables they did not create',
      'The compiler removes one of the two loops as duplicated work',
    ],
    answer: 0,
    why: 'Both threads can read the same old value, add 1 and write back, so one increment is lost. This is a race condition; a mutex or an atomic increment fixes it.',
  },
  {
    id: 'os-concurrency-coffman', topic: 'os-concurrency', level: 'medium',
    q: 'Which of these is one of the four necessary conditions (Coffman conditions) for deadlock?',
    options: ['Preemption of resources', 'Circular wait', 'Busy waiting', 'Starvation'],
    answer: 1,
    why: 'Deadlock needs mutual exclusion, hold and wait, no preemption, and circular wait. Breaking any one prevents it. Preemption is the opposite of a required condition.',
  },
  {
    id: 'os-concurrency-mutex-vs-semaphore', topic: 'os-concurrency', level: 'medium',
    q: 'How does a counting semaphore differ from a mutex?',
    options: [
      'A semaphore can only be shared between processes, never between threads',
      'A mutex allows N holders at once; a semaphore allows one',
      'A semaphore admits up to N holders at once; a mutex admits one owner',
      'They are identical; only the name differs',
    ],
    answer: 2,
    why: 'A counting semaphore starts at N and lets up to N threads proceed, useful for limiting access to a pool. A mutex provides exclusive access and is owned by the thread that locked it.',
  },
  {
    id: 'os-concurrency-virtual-memory', topic: 'os-concurrency', level: 'medium',
    q: 'What does virtual memory give each process?',
    options: [
      'Direct access to physical RAM addresses',
      'Unlimited memory, since pages on disk cost the same as pages in RAM',
      'A single heap shared with all other processes',
      'Its own address space, mapped to physical RAM by the OS and MMU',
    ],
    answer: 3,
    why: 'Each process sees a private address space; page tables map it to physical frames, which gives isolation and lets the OS page to disk. Paging to disk is slow, so memory is not free or unlimited.',
  },
  {
    id: 'os-concurrency-lock-ordering', topic: 'os-concurrency', level: 'medium',
    q: 'Thread A locks X then Y. Thread B locks Y then X. They sometimes deadlock. What is the simplest reliable fix?',
    options: [
      'Acquire the locks in the same global order in every thread',
      'Add a short sleep between the two lock calls in each thread',
      'Run more threads so that at least one of them always makes progress',
      'Make both locks reentrant so a thread can take them twice',
    ],
    answer: 0,
    why: 'A consistent lock order removes the circular wait condition, so a deadlock cannot form. A sleep only changes timing, and reentrancy only helps a thread that relocks a lock it already holds.',
  },
  {
    id: 'os-concurrency-stack-locals', topic: 'os-concurrency', level: 'easy',
    q: 'Where are a function call\'s local variables typically stored?',
    options: ['On the heap', 'On the call stack', 'Only in CPU registers', 'In the page table'],
    answer: 1,
    why: 'Each call gets a stack frame holding its locals and return address, freed automatically when the call returns. The heap holds dynamically allocated data that outlives a single call.',
  },
  {
    id: 'os-concurrency-context-switch', topic: 'os-concurrency', level: 'medium',
    q: 'Why is switching between two threads of the same process usually cheaper than switching between two processes?',
    options: [
      'Threads have no registers or program counter that need saving',
      'Threads are never preempted by the scheduler once they start running',
      'They share an address space, so page tables and TLB entries stay valid',
      'Processes must be reloaded from disk into memory after every single switch',
    ],
    answer: 2,
    why: 'A process switch changes the memory mapping, which flushes or invalidates TLB entries and hurts cache locality. A thread switch still saves and restores registers but keeps the same mapping.',
  },
  {
    id: 'os-concurrency-volatile-counter', topic: 'os-concurrency', level: 'hard',
    q: 'In Java, why is a volatile int not enough for a thread-safe counter updated with count++?',
    options: [
      'Other threads cannot read volatile variables without a lock',
      'volatile makes the variable read-only after construction',
      'volatile only has an effect on long and double fields',
      'volatile gives visibility, but count++ is still not atomic',
    ],
    answer: 3,
    why: 'volatile guarantees every thread sees the latest write, but two threads can still read the same value and both write value + 1. Use AtomicInteger.incrementAndGet() or a lock.',
  },
  {
    id: 'os-concurrency-priority-inversion', topic: 'os-concurrency', level: 'hard',
    q: 'What is priority inversion?',
    options: [
      'A high-priority task is stuck behind a low-priority lock holder that medium tasks preempt',
      'The scheduler periodically swaps task priorities so that no low-priority task starves',
      'A low-priority task never gets to run because higher-priority tasks always take the CPU',
      'Two tasks of equal priority each wait for a lock that the other one holds',
    ],
    answer: 0,
    why: 'The high-priority task is effectively blocked by medium-priority work it should outrank. Priority inheritance fixes it by temporarily raising the lock holder\'s priority. The other options describe aging, starvation and deadlock.',
  },

  // ---------------------------------------------------------------- system-design
  {
    id: 'system-design-horizontal-scaling', topic: 'system-design', level: 'easy',
    q: 'What does horizontal scaling mean?',
    options: [
      'Adding more machines to share the load',
      'Upgrading one machine with more CPU and RAM',
      'Splitting a monolith into microservices',
      'Moving the database onto faster disks',
    ],
    answer: 0,
    why: 'Horizontal scaling (scaling out) adds nodes behind a load balancer. Upgrading a single machine is vertical scaling (scaling up), which is simpler but has a hard ceiling and remains a single point of failure.',
  },
  {
    id: 'system-design-load-balancer', topic: 'system-design', level: 'easy',
    q: 'What is the main job of a load balancer?',
    options: [
      'Caching database query results close to the app servers',
      'Spreading incoming requests across several servers',
      'Encrypting data at rest',
      'Compressing static assets',
    ],
    answer: 1,
    why: 'A load balancer spreads traffic with strategies like round robin or least connections and stops sending to servers that fail health checks, which improves both capacity and availability.',
  },
  {
    id: 'system-design-cache-aside', topic: 'system-design', level: 'medium',
    q: 'In the cache-aside pattern, what happens on a cache miss?',
    options: [
      'The request fails and the client must retry',
      'The cache itself loads the value from the database and returns it',
      'The app reads the database, then writes the value into the cache',
      'The database pushes the value to every cache node',
    ],
    answer: 2,
    why: 'In cache-aside (lazy loading) the application owns the logic: check the cache, fall back to the database, then populate the cache. When the cache loads data itself, that is the read-through pattern.',
  },
  {
    id: 'system-design-cap', topic: 'system-design', level: 'medium',
    q: 'According to the CAP theorem, during a network partition a distributed system must choose between:',
    options: [
      'Latency and throughput',
      'Durability and availability',
      'Consistency and durability',
      'Consistency and availability',
    ],
    answer: 3,
    why: 'When nodes cannot talk to each other, a system either rejects some requests to stay consistent or answers them and risks stale data. Partitions cannot be ruled out in practice, so the real choice is C or A while one lasts.',
  },
  {
    id: 'system-design-message-queue', topic: 'system-design', level: 'easy',
    q: 'Why put a message queue between a web API and a slow image-processing service?',
    options: [
      'So the API can reply fast while workers process jobs at their own pace',
      'To guarantee that every uploaded image finishes processing in under one second',
      'To remove the need for a database',
      'To encrypt images while they wait to be processed by the workers',
    ],
    answer: 0,
    why: 'A queue decouples producer and consumer: the API enqueues a job and returns, traffic spikes are buffered, and workers can be scaled or restarted independently. It adds latency for the job itself, not speed.',
  },
  {
    id: 'system-design-sharding-drawback', topic: 'system-design', level: 'medium',
    q: 'A database is sharded by user_id. What is a common drawback?',
    options: [
      'Reading a single user\'s data becomes slower',
      'Queries that span many users must fan out to every shard',
      'Columns can no longer be indexed once rows are split across shards',
      'Every write now needs a distributed transaction',
    ],
    answer: 1,
    why: 'Lookups by user_id go to one shard, but cross-user queries such as global reports need scatter-gather across all shards. Writes for one user stay on one shard, so they do not need distributed transactions.',
  },
  {
    id: 'system-design-consistent-hashing', topic: 'system-design', level: 'medium',
    q: 'Why use consistent hashing to assign keys to cache nodes?',
    options: [
      'It guarantees every node holds exactly the same number of keys',
      'It encrypts keys before they are stored',
      'Adding or removing a node remaps only a small fraction of keys',
      'It removes the need for replication',
    ],
    answer: 2,
    why: 'With hash(key) mod N, changing N remaps almost every key and empties the cache. On a hash ring only keys next to the changed node move, about 1/N of them. Balance still needs virtual nodes.',
  },
  {
    id: 'system-design-eventual-consistency', topic: 'system-design', level: 'medium',
    q: 'A user updates their profile name, refreshes, and briefly sees the old name. Which model explains this behavior?',
    options: [
      'Strong consistency across all replicas',
      'Linearizability of reads and writes',
      'Serializable transaction isolation',
      'Eventual consistency with replica lag',
    ],
    answer: 3,
    why: 'The read hit a replica that had not yet received the write. Replicas converge eventually. Read-your-writes guarantees, such as reading from the leader after a write, prevent this specific case.',
  },
  {
    id: 'system-design-cache-stampede', topic: 'system-design', level: 'hard',
    q: 'A hot cache key expires and thousands of concurrent requests hit the database at once. Which technique helps most?',
    options: [
      'Let one request recompute it while others wait or get the stale value',
      'Shorten the TTL of that key so it is refreshed from the database more often',
      'Add read replicas once the spike has passed',
      'Disable caching for that key so every request reads the database',
    ],
    answer: 0,
    why: 'This is a cache stampede. A lock or single-flight per key, or serving stale data while one request refreshes, limits the database to one recomputation. A shorter TTL makes stampedes happen more often.',
  },
  {
    id: 'system-design-idempotency-key', topic: 'system-design', level: 'hard',
    q: 'A payment API can receive the same request twice because clients retry on timeouts. What is the standard protection against double charging?',
    options: [
      'Switch the endpoint from POST to GET so that retries are automatically safe',
      'A client-sent idempotency key, so the server returns the first result for repeats',
      'Reject any second request that arrives from the same IP address within one minute',
      'Disable client retries and ask users to try again manually',
    ],
    answer: 1,
    why: 'The client sends a unique key per logical operation; the server stores the key with the outcome and returns that outcome for repeats instead of charging again. GET must not have side effects, and IP rules block legitimate traffic.',
  },

  // ---------------------------------------------------------------- testing
  {
    id: 'testing-unit-vs-integration', topic: 'testing', level: 'easy',
    q: 'What distinguishes an integration test from a unit test?',
    options: [
      'It always takes longer than one minute to run, while unit tests take milliseconds',
      'It checks that components work together, such as code plus a real database',
      'It is always written before the code it tests, as TDD requires',
      'It only runs against the production environment after each deploy',
    ],
    answer: 1,
    why: 'Unit tests isolate a small piece of logic; integration tests exercise real interactions between components such as a repository and a database. Speed and timing of writing are not what defines them.',
  },
  {
    id: 'testing-pyramid', topic: 'testing', level: 'easy',
    q: 'What does the test pyramid suggest?',
    options: [
      'Mostly end-to-end tests, since they cover real user flows, and few unit tests',
      'An equal number of tests at every level',
      'Many fast unit tests, fewer integration tests, few end-to-end tests',
      'Manual testing only for anything with a UI',
    ],
    answer: 2,
    why: 'Lower-level tests are fast, cheap and precise about failures, so they form the base. End-to-end tests give confidence in whole flows but are slower and more brittle, so you keep fewer of them.',
  },
  {
    id: 'testing-tdd-cycle', topic: 'testing', level: 'easy',
    q: 'What is the basic test-driven development (TDD) cycle?',
    options: [
      'Write the code, test it manually, then deploy',
      'Design, implement, then document',
      'Write all the tests at the end of the sprint',
      'Write a failing test, make it pass, then refactor',
    ],
    answer: 3,
    why: 'Red, green, refactor: a failing test defines the next behavior, the simplest code makes it pass, and refactoring cleans up with the tests as a safety net.',
  },
  {
    id: 'testing-mock-vs-stub', topic: 'testing', level: 'medium',
    q: 'What is the usual distinction between a stub and a mock?',
    options: [
      'A stub returns canned answers; a mock also verifies how it was called',
      'A mock returns canned answers; a stub verifies how it was called',
      'A stub is only for databases; a mock is only for HTTP',
      'They are interchangeable terms in every framework',
    ],
    answer: 0,
    why: 'A stub feeds the code under test fixed data so you can assert on the result (state). A mock carries expectations about interactions, such as "send() was called once with this email" (behavior).',
  },
  {
    id: 'testing-coverage-meaning', topic: 'testing', level: 'medium',
    q: 'A project reports 100% line coverage. What does that tell you?',
    options: [
      'The code has no bugs in any path the tests reach',
      'Every line ran in some test, not that every behavior was checked',
      'Every branch and edge case in the code has been exercised and asserted on',
      'Integration tests are no longer needed for those modules',
    ],
    answer: 1,
    why: 'Coverage shows which lines executed. A test can run a line without asserting anything about it, and line coverage can miss branches and input combinations. It finds untested code but does not prove correctness.',
  },
  {
    id: 'testing-flaky-causes', topic: 'testing', level: 'medium',
    q: 'Which is a common cause of flaky tests?',
    options: [
      'Using long, descriptive names for test cases',
      'Running the tests in a CI pipeline instead of locally',
      'Depending on timing, shared state or test order',
      'Testing pure functions with fixed inputs',
    ],
    answer: 2,
    why: 'Flaky tests pass or fail without code changes. Typical causes are sleeps and race conditions, leftover state from other tests, real clocks, random data and network calls. Pure functions are the easiest code to test deterministically.',
  },
  {
    id: 'testing-what-to-fake', topic: 'testing', level: 'medium',
    q: 'In a unit test, which dependency is it most reasonable to replace with a test double?',
    options: [
      'The pure function under test',
      'A simple value object such as Money',
      'The standard library math functions',
      'A third-party payment API',
    ],
    answer: 3,
    why: 'External services are slow, cost money, have side effects and are not under your control, so they are prime candidates for fakes. Faking the code under test or simple values only makes the test less meaningful.',
  },
  {
    id: 'testing-regression', topic: 'testing', level: 'medium',
    q: 'What is a regression test?',
    options: [
      'A test that checks old behavior still works after a change',
      'A test that measures how performance degrades under heavy load',
      'A statistical analysis of past test results',
      'A test written only for brand-new features',
    ],
    answer: 0,
    why: 'Regression tests guard existing behavior; a common practice is to add one for every fixed bug so it cannot quietly return. Load testing is a separate activity.',
  },
  {
    id: 'testing-mutation-testing', topic: 'testing', level: 'hard',
    q: 'What does mutation testing measure?',
    options: [
      'How fast the test suite runs after the code changes slightly',
      'Whether tests fail when small faults are injected into the code',
      'How many lines of code the tests execute',
      'Whether the tests pass on several operating systems and versions',
    ],
    answer: 1,
    why: 'A mutation tool changes code, for example > to >= or + to -, and reruns the tests. If no test fails, the mutant "survived", which shows weak assertions that line coverage alone would not reveal.',
  },
  {
    id: 'testing-control-time', topic: 'testing', level: 'hard',
    q: 'A function reads the current time to decide whether a coupon has expired. How do you make its tests deterministic?',
    options: [
      'Run those tests only at midnight, when the date is easy to predict',
      'Add a long sleep before the assertion so the coupon expires',
      'Inject a clock or pass the time in, so tests choose the instant',
      'Mark the tests as allowed to fail and retry them in CI',
    ],
    answer: 2,
    why: 'Treating time as an input makes the function pure with respect to the clock, so a test can pass a fixed instant on either side of the expiry. Sleeps and scheduling only add slowness and flakiness.',
  },

  // ---------------------------------------------------------------- security
  {
    id: 'security-sql-injection-defense', topic: 'security', level: 'easy',
    q: 'What is the most reliable defense against SQL injection?',
    options: [
      'Escaping quotes with a regular expression',
      'Hiding database error messages from users',
      'Parameterized queries (prepared statements)',
      'Sending form data with POST instead of GET',
    ],
    answer: 2,
    why: 'With parameters, user input is sent as data and never parsed as SQL, so it cannot change the query structure. Hand-written escaping misses edge cases, and hiding errors only makes attacks harder to see.',
  },
  {
    id: 'security-authn-vs-authz', topic: 'security', level: 'easy',
    q: 'What is the difference between authentication and authorization?',
    options: [
      'They are the same check performed twice',
      'Authorization verifies identity; authentication checks permissions',
      'Authentication is only for APIs; authorization is only for web pages',
      'Authentication verifies who you are; authorization decides what you may do',
    ],
    answer: 3,
    why: 'Authentication (logging in, verifying a token) establishes identity. Authorization then checks whether that identity may perform an action, such as editing another user\'s post. The second option swaps them.',
  },
  {
    id: 'security-hashing-vs-encryption', topic: 'security', level: 'easy',
    q: 'How does hashing differ from encryption?',
    options: [
      'Hashing is one-way; encryption is reversible with the right key',
      'Hashing requires a secret key, while encryption works without one',
      'Encryption always produces output of a fixed length',
      'They are the same thing; hashing is simply faster',
    ],
    answer: 0,
    why: 'A cryptographic hash maps input to a fixed-size digest that cannot be turned back into the input. Encryption is designed to be decrypted by whoever holds the key. Hash output, not ciphertext, has a fixed length.',
  },
  {
    id: 'security-password-storage', topic: 'security', level: 'medium',
    q: 'How should a web application store user passwords?',
    options: [
      'Encrypted with AES so admins can recover them when users forget them',
      'With a slow, salted hash such as bcrypt, scrypt or Argon2',
      'Hashed once with SHA-256 and no salt',
      'In plain text in a table with restricted access',
    ],
    answer: 1,
    why: 'Password hashes should be deliberately slow and salted so stolen hashes are expensive to crack. Fast hashes like plain SHA-256 allow billions of guesses per second, and reversible encryption means one leaked key exposes every password.',
  },
  {
    id: 'security-salt-purpose', topic: 'security', level: 'medium',
    q: 'What does a unique, random salt per password protect against?',
    options: [
      'Phishing emails that trick users into typing passwords',
      'Brute-force guessing of one weak password such as 123456',
      'Precomputed rainbow tables and spotting shared passwords',
      'Session hijacking through stolen cookies',
    ],
    answer: 2,
    why: 'With a unique salt, identical passwords produce different hashes, and attackers cannot reuse a precomputed table; they must attack each hash separately. A salt does not make one weak password strong; slow hashing helps there.',
  },
  {
    id: 'security-stored-xss', topic: 'security', level: 'medium',
    q: 'Which practice best prevents stored XSS when displaying user comments?',
    options: [
      'Storing comments in a separate database, away from the user accounts table',
      'Serving the whole site over HTTPS with HSTS enabled',
      'Limiting comments to 500 characters so that full script payloads cannot fit',
      'Encoding output for its context, for example rendering it as text, not HTML',
    ],
    answer: 3,
    why: 'XSS happens when user data is interpreted as markup or script. Rendering it as text (or HTML-escaping for the exact context) stops that. HTTPS protects transport, not rendering, and short payloads can still be malicious.',
  },
  {
    id: 'security-csrf', topic: 'security', level: 'medium',
    q: 'What does a cross-site request forgery (CSRF) attack exploit?',
    options: [
      'The browser sending cookies automatically on requests from other sites',
      'Unescaped user input that the page renders as HTML',
      'Weak password hashing that lets attackers recover passwords from a stolen database',
      'Unencrypted DNS lookups that reveal which sites a user visits',
    ],
    answer: 0,
    why: 'A malicious page makes the victim\'s browser send a request to your site, and session cookies ride along, so it looks authenticated. Anti-CSRF tokens and SameSite cookies defend against it. Rendering unescaped input is XSS.',
  },
  {
    id: 'security-jwt-payload', topic: 'security', level: 'medium',
    q: 'Which statement about a standard signed JWT is true?',
    options: [
      'Its payload is encrypted, so the client cannot read the claims inside',
      'Anyone can decode its payload, but changing it breaks the signature',
      'The server can revoke it instantly by default, without extra storage',
      'It must be stored in localStorage rather than in a cookie',
    ],
    answer: 1,
    why: 'A signed JWT (JWS) guarantees integrity, not confidentiality, so never put secrets in it. Revocation needs extra work such as short expiry or a denylist, and where to store it is an application choice.',
  },
  {
    id: 'security-jwt-alg-confusion', topic: 'security', level: 'hard',
    q: 'A server verifies each JWT with whatever algorithm the token\'s header names. Why is that dangerous?',
    options: [
      'The header is encrypted, so the server cannot read the algorithm field reliably',
      'It makes every token several times larger',
      'An attacker can pick "none", or swap RS256 for HS256 keyed with the public key',
      'It forces the server to use RSA for every request',
    ],
    answer: 2,
    why: 'The header is attacker-controlled. Accepting "none" skips verification, and treating a public RSA key as an HMAC secret lets anyone forge tokens. Servers must pin the expected algorithm and key.',
  },
  {
    id: 'security-least-privilege', topic: 'security', level: 'hard',
    q: 'A web app\'s database account can DROP tables, although the app only reads and writes rows. What is the main risk?',
    options: [
      'Queries run more slowly because each one checks a longer list of privileges',
      'The connection pool fills up faster',
      'The database cannot use indexes for that account',
      'An injection bug could escalate into data loss; least privilege limits that',
    ],
    answer: 3,
    why: 'Least privilege limits the blast radius: if an attacker finds an injection or steals credentials, they can only do what the account allows. Privileges do not affect query speed or index use.',
  },

  // ---------------------------------------------------------------- git-devops
  {
    id: 'git-devops-merge-vs-rebase', topic: 'git-devops', level: 'easy',
    q: 'What does git rebase do differently from git merge?',
    options: [
      'It deletes the source branch after combining it into the target',
      'It always squashes all of your branch commits into a single new merge commit',
      'It pushes the combined result to the remote as part of the same step',
      'It replays your commits onto another base, creating new commits in a line',
    ],
    answer: 3,
    why: 'Merge keeps both histories and adds a merge commit. Rebase re-applies your commits onto the new base, creating new commit hashes and a straight line. Squashing only happens if you ask for it, for example with interactive rebase.',
  },
  {
    id: 'git-devops-continuous-integration', topic: 'git-devops', level: 'easy',
    q: 'What is continuous integration (CI)?',
    options: [
      'Merging small changes often, each one built and tested automatically',
      'Deploying the main branch to production automatically every hour',
      'Pair programming on every task',
      'Keeping a long-lived integration branch per release where features wait',
    ],
    answer: 0,
    why: 'CI means integrating into the main line frequently, with an automated build and test run on every change, so conflicts and breakage surface early. Long-lived branches are what CI tries to avoid.',
  },
  {
    id: 'git-devops-containers-vs-vms', topic: 'git-devops', level: 'easy',
    q: 'How do containers differ from virtual machines?',
    options: [
      'Each container boots its own full guest OS kernel, just like a VM does',
      'Containers share the host kernel; each VM boots its own guest kernel',
      'Virtual machines start faster than containers',
      'Containers cannot run on Linux',
    ],
    answer: 1,
    why: 'Containers isolate processes with kernel features (namespaces, cgroups) and share the host kernel, so they are light and start in seconds or less. VMs virtualize hardware and boot a full OS, which gives stronger isolation at a higher cost.',
  },
  {
    id: 'git-devops-rebase-shared-branch', topic: 'git-devops', level: 'medium',
    q: 'Why should you avoid rebasing commits that others have already pulled?',
    options: [
      'Rebase is much slower than merge on branches with many commits',
      'Rebase cannot handle conflicts, so the shared branch gets corrupted',
      'It rewrites commit hashes, so others end up with diverged history',
      'It deletes the repository\'s tags',
    ],
    answer: 2,
    why: 'Rebased commits are new objects. Anyone who built on the old ones now has a history that conflicts with the force-pushed branch, leading to duplicate commits or lost work. Rebasing local, unshared commits is fine.',
  },
  {
    id: 'git-devops-undo-pushed-commit', topic: 'git-devops', level: 'medium',
    q: 'On a shared branch, how do you safely undo a commit that has already been pushed?',
    options: [
      'git reset --hard to the previous commit, then force-push',
      'Delete the branch and recreate it from an older commit',
      'git stash the commit',
      'git revert, which adds a new commit that undoes the changes',
    ],
    answer: 3,
    why: 'git revert keeps history intact and is safe for everyone who already pulled. Resetting and force-pushing rewrites shared history. git stash only shelves uncommitted local changes.',
  },
  {
    id: 'git-devops-continuous-deployment', topic: 'git-devops', level: 'medium',
    q: 'What separates continuous deployment from continuous delivery?',
    options: [
      'Deployment releases automatically; delivery waits for a human to approve',
      'Continuous delivery skips automated tests so changes can reach users faster',
      'Continuous deployment applies only to mobile and desktop apps',
      'They are two names for the same practice used by different vendors',
    ],
    answer: 0,
    why: 'Both keep every change releasable through an automated pipeline. With delivery, a human decides when to push to production; with deployment, any change that passes the pipeline goes live automatically.',
  },
  {
    id: 'git-devops-fast-forward', topic: 'git-devops', level: 'medium',
    q: 'When can git merge perform a fast-forward?',
    options: [
      'When both branches have gained new commits since they diverged',
      'When the current branch has no commits the other branch lacks',
      'Whenever there are no merge conflicts',
      'When the two branches have different authors',
    ],
    answer: 1,
    why: 'If the current branch tip is an ancestor of the other branch, Git just moves the pointer forward and creates no merge commit. If both sides have new commits, a real merge is needed even without conflicts.',
  },
  {
    id: 'git-devops-twelve-factor-config', topic: 'git-devops', level: 'medium',
    q: 'Where should environment-specific settings such as database URLs live in a twelve-factor app?',
    options: [
      'Hard-coded in a separate git branch per environment',
      'In a config file committed together with production passwords',
      'In environment variables provided at deploy time',
      'Baked into a different Docker image for each environment',
    ],
    answer: 2,
    why: 'Twelve-factor keeps config out of code: the same build artifact runs everywhere, and each environment supplies its settings (secrets ideally through a secret manager). Per-environment images or branches break that.',
  },
  {
    id: 'git-devops-docker-layer-cache', topic: 'git-devops', level: 'hard',
    q: 'In a Dockerfile, why copy package.json and install dependencies before copying the rest of the source code?',
    options: [
      'Docker requires package.json to be copied before any other project file',
      'It makes the final image smaller by removing source files',
      'It prevents the container from running as root',
      'Layer caching: the install step reruns only when package.json changes',
    ],
    answer: 3,
    why: 'Each instruction creates a cached layer that is reused if its inputs are unchanged. If you copy all source first, any code edit invalidates the install layer and forces a full reinstall on every build.',
  },
  {
    id: 'git-devops-bisect', topic: 'git-devops', level: 'hard',
    q: 'A bug appeared somewhere in the last 200 commits. What does git bisect do?',
    options: [
      'It binary-searches the commits, so about 8 tests find the first bad one',
      'It shows which author last changed each line of a file',
      'It splits one large commit into two smaller ones for review',
      'It reverts half of the recent commits automatically, then the other half',
    ],
    answer: 0,
    why: 'You mark a good and a bad commit, and Git checks out the midpoint each step, halving the range. log2(200) is about 7.6, so roughly 8 tests. It can also run a test script automatically with git bisect run. Line authorship is git blame.',
  },

  // ---------------------------------------------------------------- javascript
  {
    id: 'javascript-loose-vs-strict-equality', topic: 'javascript', level: 'easy',
    q: 'What does this print?',
    code: `console.log(0 == '0', 0 === '0');`,
    options: ['true false', 'false false', 'true true', 'false true'],
    answer: 0,
    why: '== converts the string to a number before comparing, so 0 == \'0\' is true. === compares type as well as value, and a number is never strictly equal to a string.',
  },
  {
    id: 'javascript-typeof-null', topic: 'javascript', level: 'easy',
    q: 'What does this print?',
    code: `console.log(typeof null);`,
    options: ['null', 'object', 'undefined', 'number'],
    answer: 1,
    why: 'typeof null returns "object", a long-standing quirk kept for backward compatibility. To check for null, compare with value === null.',
  },
  {
    id: 'javascript-var-in-loop', topic: 'javascript', level: 'medium',
    q: 'What does this print?',
    code: `for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}`,
    options: ['0 1 2', '0 0 0', '3 3 3', 'undefined undefined undefined'],
    answer: 2,
    why: 'var is function-scoped, so all three callbacks close over the same i, which is 3 by the time they run. With let, each iteration gets a fresh binding and it prints 0 1 2.',
  },
  {
    id: 'javascript-event-loop-order', topic: 'javascript', level: 'medium',
    q: 'In what order are the letters printed?',
    code: `console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
console.log('D');`,
    options: ['A B C D', 'A D B C', 'A C D B', 'A D C B'],
    answer: 3,
    why: 'Synchronous code runs first (A, D). Then the microtask queue drains (promise callback C) before the next macrotask (the setTimeout callback B), even with a 0 ms delay.',
  },
  {
    id: 'javascript-closure-counter', topic: 'javascript', level: 'easy',
    q: 'What does this print?',
    code: `function counter() {
  let n = 0;
  return () => ++n;
}
const c = counter();
c(); c();
console.log(c());`,
    options: ['3', '1', '2', 'undefined'],
    answer: 0,
    why: 'The returned arrow function closes over n, which persists between calls. The two earlier calls bring it to 2 and the third returns 3. Each call to counter() would create a separate n.',
  },
  {
    id: 'javascript-hoisting-var-let', topic: 'javascript', level: 'medium',
    q: 'What happens when this runs?',
    code: `console.log(a);
var a = 5;
console.log(b);
let b = 6;`,
    options: [
      'It prints 5, then 6',
      'It prints undefined, then throws a ReferenceError',
      'It throws a ReferenceError on the first line',
      'It prints undefined twice',
    ],
    answer: 1,
    why: 'var declarations are hoisted and initialized to undefined. let is hoisted too but stays in the temporal dead zone until its declaration runs, so reading b early throws a ReferenceError.',
  },
  {
    id: 'javascript-arrow-this', topic: 'javascript', level: 'medium',
    q: 'How is the value of this determined inside an arrow function?',
    options: [
      'It depends on how the function is called, as with regular functions',
      'It always refers to the global object',
      'It comes lexically from the scope where the arrow is defined',
      'It refers to the arrow function itself',
    ],
    answer: 2,
    why: 'Arrow functions have no own this; they use the this of the surrounding code, and call, apply or bind cannot change it. That makes them handy for callbacks but wrong for object methods that need this to be the object.',
  },
  {
    id: 'javascript-promise-all-reject', topic: 'javascript', level: 'medium',
    q: 'What does Promise.all do when one of its input promises rejects?',
    options: [
      'Waits for all of them and returns an array mixing results and errors',
      'Ignores the rejection and resolves with the remaining values',
      'Resolves with the first value that fulfilled',
      'Rejects as soon as that promise rejects, with its reason',
    ],
    answer: 3,
    why: 'Promise.all fails fast on the first rejection; the other promises keep running but their results are ignored. Promise.allSettled waits for everything and reports each outcome.',
  },
  {
    id: 'javascript-prototype-mutation', topic: 'javascript', level: 'hard',
    q: 'What does this print?',
    code: `function Dog() {}
Dog.prototype.speak = function () { return 'woof'; };
const d = new Dog();
Dog.prototype.speak = function () { return 'bark'; };
console.log(d.speak());`,
    options: ['bark', 'woof', 'undefined', 'TypeError'],
    answer: 0,
    why: 'd does not copy methods; it links to the Dog.prototype object, and speak is looked up at call time. Replacing the property on that same prototype object changes what existing instances see.',
  },
  {
    id: 'javascript-default-sort', topic: 'javascript', level: 'hard',
    q: 'What does this print?',
    code: `console.log([10, 1, 2].sort());`,
    options: ['[1, 2, 10]', '[1, 10, 2]', '[10, 2, 1]', '[2, 1, 10]'],
    answer: 1,
    why: 'Without a comparator, sort converts elements to strings and compares them by UTF-16 code units, and "10" comes before "2". Use sort((a, b) => a - b) for numeric order.',
  },

  // ---------------------------------------------------------------- python
  {
    id: 'python-mutable-default-arg', topic: 'python', level: 'medium',
    q: 'What does this print?',
    code: `def add(item, items=[]):
    items.append(item)
    return items

add(1)
print(add(2))`,
    options: ['[2]', '[1, 2]', '[2, 1]', 'TypeError'],
    answer: 1,
    why: 'Default values are evaluated once, when the function is defined, so every call shares the same list. Use items=None and create a new list inside the function.',
  },
  {
    id: 'python-is-vs-equals', topic: 'python', level: 'easy',
    q: 'What is the difference between is and == in Python?',
    options: [
      'is compares values; == compares object identity',
      'They behave the same for every object except None',
      'is checks object identity; == checks value equality',
      'is works only with small numbers and short strings',
    ],
    answer: 2,
    why: '== calls __eq__ to compare values; is compares object identity. Two equal lists are == but not the same object. Use is for singletons such as None.',
  },
  {
    id: 'python-list-aliasing', topic: 'python', level: 'easy',
    q: 'What does this print?',
    code: `a = [1, 2, 3]
b = a
b.append(4)
print(a)`,
    options: ['[1, 2, 3]', '[4]', '[1, 2, 3, 4, 4]', '[1, 2, 3, 4]'],
    answer: 3,
    why: 'Assignment binds b to the same list object as a; it does not copy. Mutating through b is visible through a. Use a.copy() or list(a) for a shallow copy.',
  },
  {
    id: 'python-list-comprehension', topic: 'python', level: 'easy',
    q: 'What does this print?',
    code: `print([x * x for x in range(5) if x % 2 == 0])`,
    options: ['[0, 4, 16]', '[1, 9]', '[0, 1, 4, 9, 16]', '[4, 16]'],
    answer: 0,
    why: 'range(5) yields 0 to 4; the filter keeps the even values 0, 2 and 4, and their squares are 0, 4 and 16.',
  },
  {
    id: 'python-gil', topic: 'python', level: 'medium',
    q: 'In standard CPython (the default build with the GIL), what does the GIL mean for CPU-bound code?',
    options: [
      'Threads run Python bytecode truly in parallel on all available CPU cores',
      'One thread runs Python bytecode at a time, so threads give no CPU speedup',
      'Multiple processes cannot be used for parallelism',
      'Threads cannot overlap while waiting on I/O, so network calls run one by one',
    ],
    answer: 1,
    why: 'The Global Interpreter Lock lets one thread execute bytecode at a time. Threads still help I/O-bound code because the GIL is released while waiting. For CPU-bound work use multiprocessing or native extensions.',
  },
  {
    id: 'python-generators', topic: 'python', level: 'medium',
    q: 'What is the main advantage of a generator over building a full list?',
    options: [
      'Generators can be indexed like lists',
      'Generators are always faster per item',
      'Items are produced lazily, so memory stays small for huge sequences',
      'A generator can be iterated again and again without being recreated',
    ],
    answer: 2,
    why: 'A generator yields one item at a time and keeps only its current state, so it can stream large or infinite sequences. It cannot be indexed and is exhausted after one pass.',
  },
  {
    id: 'python-decorator', topic: 'python', level: 'medium',
    q: 'What is a decorator in Python?',
    options: [
      'A type hint that changes how the function behaves at runtime',
      'A special comment that documents a function and its parameters',
      'A class attribute that marks the methods below it as private to the class',
      'A callable that wraps a function and returns a replacement, applied with @',
    ],
    answer: 3,
    why: '@decorator above def f is shorthand for f = decorator(f). Decorators typically wrap the function to add logging, caching or access checks; functools.wraps keeps the original name and docstring.',
  },
  {
    id: 'python-tuple-with-list', topic: 'python', level: 'medium',
    q: 'What does this print?',
    code: `t = ([1, 2], 3)
t[0].append(9)
print(t)`,
    options: [
      '([1, 2, 9], 3)',
      'TypeError: tuple does not support item assignment',
      '([1, 2], 3)',
      '([1, 2], 3, 9)',
    ],
    answer: 0,
    why: 'The tuple is immutable in which objects it holds, but the list inside it is mutable. append changes the list in place without reassigning a tuple slot, so no error is raised.',
  },
  {
    id: 'python-late-binding-closures', topic: 'python', level: 'hard',
    q: 'What does this print?',
    code: `fns = [lambda: i for i in range(3)]
print([f() for f in fns])`,
    options: ['[0, 1, 2]', '[2, 2, 2]', '[3, 3, 3]', '[0, 0, 0]'],
    answer: 1,
    why: 'Closures look up i when called, not when created. All three lambdas share the comprehension\'s i, which ends at 2. Bind it early with lambda i=i: i to get [0, 1, 2].',
  },
  {
    id: 'python-unbound-local', topic: 'python', level: 'hard',
    q: 'What happens when this runs?',
    code: `x = 10
def f():
    x += 1
    return x
print(f())`,
    options: ['It prints 11 (x is updated)', 'It prints 10 (x is unchanged)', 'UnboundLocalError is raised', 'It prints None'],
    answer: 2,
    why: 'Assigning to x anywhere in f makes x local to the whole function, so x += 1 reads a local that has no value yet. Declare global x (or nonlocal in nested functions) to modify the outer variable.',
  },

  // ---------------------------------------------------------------- java
  {
    id: 'java-string-equals-vs-identity', topic: 'java', level: 'easy',
    q: 'What does this print?',
    code: `String a = new String("hi");
String b = new String("hi");
System.out.println((a == b) + " " + a.equals(b));`,
    options: ['true true', 'true false', 'false true', 'false false'],
    answer: 2,
    why: 'new String always creates a distinct object, so == (reference comparison) is false. equals compares characters, so it is true. Always compare strings with equals.',
  },
  {
    id: 'java-string-immutability', topic: 'java', level: 'easy',
    q: 'What does this print?',
    code: `String s = "abc";
s.toUpperCase();
System.out.println(s);`,
    options: ['ABC', 'Abc', 'A compile error', 'abc'],
    answer: 3,
    why: 'Strings are immutable: toUpperCase returns a new String and leaves s unchanged. The result was discarded here; you would need s = s.toUpperCase().',
  },
  {
    id: 'java-equals-hashcode', topic: 'java', level: 'medium',
    q: 'A class overrides equals() but not hashCode(). What breaks?',
    options: [
      'HashMap and HashSet may treat equal objects as different keys',
      'The class no longer compiles because the contract is checked',
      'equals() is never called by the collections',
      'Collections.sort throws an exception for objects of that class',
    ],
    answer: 0,
    why: 'The contract says equal objects must have equal hash codes. Without the override, two equal objects usually get different identity-based hashes, land in different buckets, and lookups miss.',
  },
  {
    id: 'java-abstract-class-vs-interface', topic: 'java', level: 'medium',
    q: 'In Java 17, what can an abstract class have that an interface cannot?',
    options: ['Default methods with bodies', 'Instance fields and constructors', 'Static methods and constants', 'Private helper methods with bodies'],
    answer: 1,
    why: 'Since Java 8 interfaces can have default and static methods, and since Java 9 private methods, but they still cannot have instance fields or constructors. A class can also extend only one abstract class but implement many interfaces.',
  },
  {
    id: 'java-checked-exceptions', topic: 'java', level: 'easy',
    q: 'Which statement about checked exceptions in Java is true?',
    options: [
      'They extend RuntimeException, so the compiler tracks them',
      'Only the JVM is allowed to throw them, never application code',
      'They must be caught or declared with throws, or compilation fails',
      'They cannot be caught, only declared and passed up the call stack',
    ],
    answer: 2,
    why: 'Checked exceptions (subclasses of Exception but not RuntimeException, such as IOException) are enforced by the compiler. Unchecked exceptions extend RuntimeException and need no declaration.',
  },
  {
    id: 'java-type-erasure', topic: 'java', level: 'medium',
    q: 'Because of type erasure, which line does not compile? Assume obj is declared as Object.',
    options: [
      'List<String> list = new ArrayList<>();',
      'Map<String, Integer> m = new HashMap<>();',
      'List<? extends Number> nums = new ArrayList<Integer>();',
      'if (obj instanceof List<String>) { }',
    ],
    answer: 3,
    why: 'Generic type arguments are erased at runtime, so the JVM cannot check whether an Object is a List of String. instanceof List<?> or a raw List works. The other lines are ordinary, valid generic code.',
  },
  {
    id: 'java-jvm-memory', topic: 'java', level: 'medium',
    q: 'In the JVM, where do objects created with new live, and where do local primitive variables live?',
    options: [
      'Objects on the heap; local primitives in the thread\'s stack frame',
      'Both on the thread stack, freed when the method returns',
      'Both on the shared heap, managed by the garbage collector',
      'Objects on the thread stack; local primitives on the garbage-collected heap',
    ],
    answer: 0,
    why: 'Objects are allocated on the garbage-collected heap shared by all threads. Each thread has its own stack, and a method\'s frame holds its local primitives and references. (The JIT may optimize some allocations away, but this is the model.)',
  },
  {
    id: 'java-hashmap-vs-treemap', topic: 'java', level: 'medium',
    q: 'How do HashMap and TreeMap differ?',
    options: [
      'HashMap keeps keys sorted by their hash; TreeMap keeps keys in insertion order',
      'TreeMap keeps keys sorted (O(log n)); HashMap is unordered (O(1) average)',
      'TreeMap allows duplicate keys, storing them next to each other',
      'HashMap is thread-safe by default, while TreeMap needs external locking',
    ],
    answer: 1,
    why: 'TreeMap is a red-black tree ordered by key (natural order or a Comparator). HashMap gives no order guarantee; LinkedHashMap keeps insertion order. Neither allows duplicate keys, and neither is thread-safe.',
  },
  {
    id: 'java-integer-cache', topic: 'java', level: 'hard',
    q: 'With default JVM settings, what does this print?',
    code: `Integer a = 127, b = 127;
Integer c = 128, d = 128;
System.out.println((a == b) + " " + (c == d));`,
    options: ['true true', 'false false', 'true false', 'false true'],
    answer: 2,
    why: 'Autoboxing uses Integer.valueOf, which caches values from -128 to 127, so a and b are the same object. 128 is outside the cache, so c and d are different objects and == compares references. Use equals.',
  },
  {
    id: 'java-concurrent-modification', topic: 'java', level: 'hard',
    q: 'What happens when this runs?',
    code: `List<Integer> list = new ArrayList<>(List.of(1, 2, 3));
for (Integer x : list) {
    if (x == 1) list.remove(x);
}`,
    options: [
      'It finishes and the list becomes [2, 3]',
      'It fails to compile because x is an Integer',
      'The loop never terminates because the size keeps changing',
      'A ConcurrentModificationException is thrown',
    ],
    answer: 3,
    why: 'The for-each loop uses an iterator, and removing through the list (not the iterator) changes modCount, so the next call to next() fails fast. Use iterator.remove() or list.removeIf(x -> x == 1).',
  },
];
