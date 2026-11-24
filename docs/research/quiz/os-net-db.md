# Quiz concept map: Operating Systems, Concurrency, Networking and the Web, Databases and SQL

Audience: first-job (junior / new grad) and student-position candidates, many in Israel (Intel, Nvidia, Microsoft, Check Point, Amdocs, Wix, monday.com).
Goal: map the CONCEPTS interviewers probe so we can write original multiple-choice questions that test understanding ("why", "what happens if", "which fits"). Nothing here is copied question text; all source material is paraphrased.

Research notes and limits:
- Firecrawl credits ran out partway; the rest used WebSearch/WebFetch. Reddit pages could not be fetched directly (blocked), so Reddit evidence is limited to search titles and snippets.
- Israel-specific evidence is thin but consistent: student reports from Israeli employers (Microsoft Israel student, Verint, Hello Heart, Mobileye, Intel) lean heavily on threads, deadlock, synchronization and memory, and Israeli university OS courses (HUJI, Technion, TAU) teach exactly the classical syllabus (processes, scheduling, paging, semaphores, deadlock). Hardware-adjacent employers (Intel, Nvidia, Mobileye, Check Point) push OS + concurrency + C memory harder; web/product companies (Wix, monday.com) push HTTP/REST/SQL harder.
- Style note: sources agree that the strong signal is causal reasoning (trace what happens, pick a primitive from the invariant), not definitions. PracHub explicitly contrasts "lists definitions" (weak) with "explains isolation, failure boundaries and switch costs" (strong). Our questions should be scenario-based.

---

## 1. Operating systems

### 1.1 Weight: HIGH (student roles at Intel/Nvidia/Mobileye/Check Point), MEDIUM (web product companies)
Reason: every Israeli CS degree has a mandatory OS course, so student interviewers treat it as fair game; process vs thread and virtual memory are among the most-reported questions everywhere.

### 1.2 Concept map

1. **Process vs thread**
   - Process = isolated address space + resources (open files, PID); thread = execution context (registers, stack, PC) inside a process.
   - Threads share heap, globals, code and open files; each thread has its own stack and registers.
   - Consequences: a crash (segfault) in one thread kills the whole process; a crash in a child process does not kill the parent.
   - Communication cost: threads talk through shared memory (cheap, but needs synchronization); processes need IPC (pipes, sockets, shared memory segments).
   - When to choose processes: isolation, fault containment, security boundaries (e.g. browser tabs). When threads: shared state, lower creation and switch cost.
2. **Process lifecycle and states**
   - Ready / running / blocked (waiting); what moves a process between states (I/O request -> blocked; I/O completes -> ready, not running).
   - fork() duplicates the process (copy-on-write in practice); exec() replaces the program image; wait() reaps the child.
   - Zombie (exited, not yet reaped) vs orphan (parent died, re-parented to init).
   - fork return values: 0 in child, child PID in parent. "How many processes after N forks" style reasoning (2^N) is a legitimate understanding check when kept small.
3. **Context switch**
   - What is saved and restored (registers, PC, stack pointer, for processes also the address-space mapping).
   - Why a process switch costs more than a thread switch within the same process (address-space change, TLB flush or tagging, cache pollution).
   - What triggers it: timer interrupt (preemption), blocking system call, yield.
   - Why too many threads hurts throughput (switching overhead, cache misses).
4. **User mode vs kernel mode, system calls**
   - CPU privilege levels; why user code cannot touch hardware or other processes' memory directly.
   - A system call is a controlled entry into the kernel (trap); costlier than a normal function call.
   - Examples of what needs a syscall (read a file, allocate pages, create a process) vs what does not (arithmetic, calling a library function that stays in user space).
   - Interrupts vs exceptions vs system calls at a high level.
5. **CPU scheduling basics**
   - Preemptive vs non-preemptive.
   - FCFS (convoy effect), SJF/SRTF (optimal average wait, needs prediction, starvation of long jobs), Round Robin (time quantum tradeoff: too small = switching overhead, too large = FCFS), priority (starvation, aging).
   - Metrics: throughput, turnaround, waiting time, response time; interactive vs batch goals conflict.
   - I/O-bound vs CPU-bound jobs and why schedulers favor I/O-bound ones for responsiveness (MLFQ idea).
6. **Virtual memory**
   - Each process sees its own virtual address space; the MMU translates to physical addresses.
   - Why: isolation, simpler programming model, ability to use more memory than physical RAM, sharing (shared libraries, copy-on-write).
   - Two processes can use the same virtual address for different physical pages.
7. **Paging and page tables**
   - Page / frame, page table maps virtual page number to frame; offset is unchanged.
   - Address split arithmetic at small scale (4 KB page -> 12 offset bits).
   - Multi-level page tables exist to avoid huge tables for sparse address spaces (concept only).
   - Fragmentation: paging removes external fragmentation, keeps some internal fragmentation.
8. **TLB**
   - Cache of translations; why every memory access does not walk the page table.
   - TLB miss vs page fault (miss = translation not cached, page may be in RAM; fault = page not present or protection violation).
   - Locality makes TLBs effective.
9. **Page faults and swapping**
   - Minor vs major fault (concept), demand paging, page replacement (LRU idea, FIFO and Belady at concept level).
   - Thrashing: working sets exceed RAM, system spends time paging; symptom is high disk activity with low CPU progress.
   - Protection fault (segfault) is not the same as "needs to load from disk".
10. **Process memory layout**
    - Text, data/BSS, heap (grows up), stack (grows down); what lives where (locals and return addresses on stack, malloc/new on heap, globals in data).
    - Stack overflow from deep recursion vs heap exhaustion; memory leak means heap not freed, not stack.
    - Strong link to C/C++ questions common at Intel/Nvidia (pointer to a local returned from a function = dangling).
11. **Interprocess communication**
    - Pipes, message queues, shared memory, sockets, signals; tradeoff of shared memory (fast, needs sync) vs message passing (simpler, copies).
12. **Files and I/O (light)**
    - File descriptor as a per-process handle; buffering means write() may not hit disk immediately (fsync idea).
    - Blocking vs non-blocking I/O at concept level (links to async/event loop).
13. **Concurrency vs parallelism**
    - Concurrency = structure of overlapping tasks (possible on one core); parallelism = simultaneous execution on multiple cores.

### 1.3 Classic traps / distractors
- "Threads have separate heaps" or "threads share stacks".
- "Virtual memory means using disk as RAM" (that is swapping, one use of VM; the core idea is address translation and isolation).
- "A page fault always means a bug/crash" (most are normal demand paging).
- "TLB miss = page fault".
- "Blocked process goes straight back to running when I/O completes" (it goes to ready).
- "A context switch between threads costs the same as between processes."
- "System calls are just normal function calls" or "printf is a system call" (it is a library call that may eventually call write()).
- "More threads always means faster" (switching, contention, Amdahl's law, cores).
- "Round Robin with a tiny quantum is always fairer and better" (overhead dominates).
- "SJF is unfair to short jobs" (it starves long jobs).
- "Killing a thread with a segfault leaves other threads running."
- "fork() creates a thread" / "fork copies all memory immediately" (copy-on-write).
- "Kernel mode is a user with admin/root rights" (root is a user-level permission concept; kernel mode is a CPU privilege level).

### 1.4 Exclude (trivia or too senior)
- Banker's algorithm step-by-step numeric execution (concept that "avoidance needs advance knowledge of max demand" is fine; long matrix computation is not).
- Exact Linux scheduler internals (CFS red-black tree, vruntime formulas), NUMA, huge pages tuning.
- Inverted page tables, exact x86-64 4/5-level paging bit layouts, segment descriptor details.
- Specific syscall numbers, flag names, signal numbers.
- File system internals (inodes layout, journaling modes, LFS, RAID levels) beyond "a file descriptor is a handle".
- Boot process details, BIOS/UEFI, real-time OS scheduling proofs.
- Multi-step page replacement simulations with long reference strings (one short trace is OK).

### 1.5 Sources
- https://prachub.com/resources/operating-systems-interview-questions-for-software-engineers-processes-memory-scheduling-and-concurrency - good, practical; frames weak vs strong answers (trace states, translate addresses, choose primitive from invariant).
- https://pages.cs.wisc.edu/~remzi/OSTEP/ - OSTEP free textbook (Arpaci-Dusseau); best canonical concept list (virtualization, concurrency, persistence). Free to read, no CC license stated; link, do not copy.
- https://www.cs.huji.ac.il/course/2010/os/notes/os-notes.pdf - Feitelson's Hebrew University OS notes; shows what Israeli students actually study.
- https://shnaton.huji.ac.il/index.php/NewSyl/67808/2/2025/ - HUJI course catalog entry for OS (67808); confirms syllabus.
- https://www.geeksforgeeks.org/operating-systems/operating-systems-interview-questions/ - broad, definition-heavy list; useful for coverage, weak on "why".
- https://workat.tech/core-cs/article/top-operating-system-interview-questions-and-answers-lgy1kyszlr72/index.html - compact list (states, PCB, fork/exec, zombie/orphan, schedulers, deadlock vs livelock vs starvation); slightly dated.
- https://www.glassdoor.sg/Interview/Intel-Corporation-OS-Software-Engineer-Interview-Questions-EI_IE1519.0,17_KO18,38.htm - Intel OS role reports (sync problem in C, endianness, stack direction); shows hardware-company flavor.
- https://www.glassdoor.com/Interview/algorithms-leetcode-like-memory-managment-operations-on-pointers-with-applying-changes-in-the-live-coding-task-QTN_8022458.htm - Intel internship report: memory management and pointers alongside algorithms.
- https://prachub.com/resources/intel-software-engineering-intern-interview-2027-c-c-operating-systems-and-hardware - Intel intern prep: C/C++, OS, concurrency, plus Linux, SQL, Git, networking.
- https://github.com/Kaushik268mlore/OPERATING-SYSTEMS - GitHub OS interview question list; license not verified, use only as coverage check.

---

## 2. Concurrency

### 2.1 Weight: HIGH
Reason: the single most consistent theme in Israeli student/junior reports (Microsoft Israel student: timer + thread task; Verint: preventing deadlock, synchronized, wait/notify; Hello Heart: implement a thread pool; Mobileye multithreading roles), and it is where conceptual MCQs work best.

### 2.2 Concept map

1. **Race conditions**
   - Definition: result depends on interleaving; requires shared mutable state + at least one writer + no ordering.
   - Why `count++` is not atomic (read-modify-write, three steps); predict possible final values of two threads incrementing.
   - Check-then-act races (if not exists then create; lazy singleton).
   - Races can be rare and timing-dependent; passing tests do not prove absence.
2. **Critical section requirements**
   - Mutual exclusion, progress, bounded waiting; keep critical sections short.
3. **Atomicity and atomic operations**
   - Hardware atomics (compare-and-swap, test-and-set) as the building block of locks.
   - Atomic variable fixes a single counter but not an invariant spanning two variables (e.g. transfer between two balances).
   - Visibility: without synchronization, one thread may not see another's write (volatile/memory model at concept level only).
4. **Mutex (lock)**
   - Ownership: the thread that locks unlocks; protects an invariant, not "a line of code".
   - Forgetting to unlock on an error path (why RAII / try-finally / `with`).
   - Lock granularity tradeoff: one global lock (simple, low concurrency) vs fine-grained (more concurrency, deadlock risk).
   - Spinlock vs blocking lock: spin only when the wait is very short and on multi-core.
5. **Semaphore**
   - Counter + wait/signal (P/V); counting semaphore limits concurrent access to N resources (connection pool).
   - Binary semaphore vs mutex: semaphore has no owner, can be signaled by another thread, used for signaling/ordering.
6. **Condition variables and monitors**
   - Wait releases the mutex atomically and re-acquires on wake.
   - Always re-check the condition in a `while` loop (spurious wakeups, another thread consumed the item).
   - Signal vs broadcast; lost wakeup if you check the condition without holding the lock.
   - Monitor = object whose methods are mutually exclusive plus condition variables (Java `synchronized` + wait/notify, C# lock + Monitor).
7. **Deadlock**
   - Four necessary conditions together (Coffman): mutual exclusion, hold-and-wait, no preemption, circular wait.
   - Classic two-lock example: thread A locks X then Y, thread B locks Y then X.
   - Prevention = break one condition: global lock ordering (circular wait), acquire all at once (hold-and-wait), try-lock with timeout and back off (no preemption).
   - Avoidance (needs advance knowledge, Banker's idea) vs detection and recovery (wait-for graph cycle, kill/rollback a victim) vs ignoring (ostrich).
   - Symptom: threads stuck, CPU low.
8. **Livelock and starvation**
   - Livelock: threads keep reacting to each other, CPU busy, no progress (both back off and retry in sync).
   - Starvation: some thread never gets the resource (writer starvation in RW locks, priority scheduling); deadlock implies starvation but not the reverse.
9. **Producer-consumer (bounded buffer)**
   - Needs mutual exclusion on the buffer plus waiting when full/empty: mutex + two condition variables, or mutex + two counting semaphores (empty slots, full slots).
   - Order of operations matters: waiting on a semaphore while holding the mutex can deadlock.
   - Backpressure: a bounded queue slows producers instead of using unbounded memory.
10. **Readers-writers**
    - Many readers or one writer; reader-preference starves writers; when a RW lock is not worth it (short critical sections, write-heavy).
11. **Thread safety in practice**
    - Immutable objects and thread confinement (no sharing) as the simplest safety.
    - A thread-safe collection does not make a compound operation safe (`if (!map.contains(k)) map.put(k, v)`).
    - Thread pools: why reuse threads (creation cost, bounded concurrency); task queue is a producer-consumer.
    - Dining philosophers as the canonical illustration of circular wait and ordering fixes.
12. **Async / event loop vs threads (web-oriented juniors)**
    - JavaScript single-threaded event loop: no data races between callbacks, but logical races across `await` points still exist.
    - I/O-bound work: async or threads; CPU-bound work: processes/workers (Python GIL at concept level: threads do not speed up pure-Python CPU work).

### 2.3 Classic traps / distractors
- "`x++` is a single atomic instruction in high-level code."
- "Marking a variable volatile makes increments thread-safe."
- "A mutex and a binary semaphore are identical."
- "Deadlock requires any one of the four conditions" (all four must hold; prevention breaks any one).
- "Deadlock prevention: just add more locks" or "use a timeout so it is impossible to wait" (timeouts break no-preemption only with retry/back-off logic).
- "Use `if` before `wait()`" (should be `while`).
- "Livelock means threads are blocked" (they are running).
- "Starvation and deadlock are the same."
- "Using a thread-safe map makes my check-then-put safe."
- "Single-threaded JavaScript cannot have race conditions."
- "Locking the whole method is always correct and free."
- "Two threads reading the same variable is a race" (no writer = no data race).
- "Python threads run CPU-bound code in parallel" (GIL in CPython).

### 2.4 Exclude
- Memory-model formalism (happens-before proofs, acquire/release orderings, C++ memory_order variants).
- Lock-free data structure implementation, ABA problem details, RCU internals, hazard pointers.
- Language-specific API trivia (exact `java.util.concurrent` class names, pthread function signatures).
- Peterson's/Dekker's algorithm line-by-line proofs (the idea that software-only solutions exist is fine).
- Puzzle problems needing long code tracing (barber shop, Uber ride, H2O) as MCQs; better as coding tasks.
- Distributed locking, consensus, CRDTs.

### 2.5 Sources
- https://www.educative.io/blog/top-five-concurrency-interview-questions-for-software-engineers - RW lock, dining philosophers, async-to-sync, barber shop; good for what each problem tests (starvation, missed wakeup).
- https://www.techinterview.org/post/3233474149/coding-interview-concurrency-patterns-threads-locks-mutex-semaphore-deadlock-producer-consumer-reader-writer-async-await/ - concise survey: primitives, Coffman conditions, prevention, bounded buffer with two CVs, RW locks.
- https://people.cs.rutgers.edu/pxk/416/notes/06-sync.html - Rutgers OS notes on synchronization; solid university baseline for race conditions and critical sections.
- https://cs61.seas.harvard.edu/wiki/2018/Section12/ - Harvard CS61 threads section; threads share heap/globals, sync primitives.
- https://pages.cs.wisc.edu/~remzi/OSTEP/ - OSTEP concurrency chapters (locks, CVs, semaphores, concurrency bugs); canonical, free to read.
- https://www.glassdoor.ie/Interview/Verint-Interview-E14765-RVW15502305.htm - Israeli employer report: deadlock prevention, synchronized, wait/notify.
- https://www.glassdoor.com.au/Interview/Hello-Heart-Back-End-Developer-Interview-Questions-EI_IE1998301.0,11_KO12,30.htm - Tel Aviv backend report: implement a thread pool.
- https://www.jointaro.com/interviews/companies/microsoft/experiences/software-engineer-student-israel-may-9-2025-no-offer-positive-535957d3/ - Microsoft Israel student-role report mentioning a timer + thread question (page rate-limited on fetch; seen via search snippet).
- https://www.glassdoor.ca/Interview/Mobileye-R-T-Multithreading-Software-Engineer-Interview-Questions-EI_IE413091.0,8_KO9,45.htm - Mobileye multithreading role reports; confirms Israeli demand.
- Hebrew deadlock lecture slides (Google Slides, Zvika Berger, Hebrew with English headings): https://docs.google.com/presentation/d/1bAn75aXgOuGpvdPCPHuG_Q11b2h8RsVl/htmlpresent - per search snippet covers the four conditions and prevention / avoidance / recovery / ignore; link now returns 410 Gone.

---

## 3. Computer networking and the web

### 3.1 Weight: MEDIUM-HIGH (HIGH for web/product companies like Wix, monday.com; MEDIUM for Intel/Nvidia)
Reason: "what happens when you type a URL" is the anchor question across prep sources, and every backend/full-stack junior gets HTTP/REST; deep routing/subnetting is rarely asked of software juniors.

### 3.2 Concept map

1. **Layering (OSI / TCP-IP) at junior depth**
   - Why layers exist (encapsulation, each layer uses the one below); the 4-layer TCP/IP view maps to app (HTTP, DNS), transport (TCP, UDP), network (IP), link (Ethernet, Wi-Fi).
   - Which layer a concept belongs to: ports = transport, IP addresses = network, MAC = link, HTTP = application.
   - Encapsulation: HTTP message inside TCP segment inside IP packet inside frame.
2. **IP addresses, ports and sockets**
   - IP identifies a host (interface), port identifies a process/service on it; a connection is identified by the 4-tuple (src IP, src port, dst IP, dst port) so a server on port 443 can hold many clients.
   - Private vs public addresses and NAT at concept level (why many home devices share one public IP); localhost.
3. **TCP vs UDP**
   - TCP: connection-oriented, reliable, ordered byte stream, flow and congestion control; UDP: datagrams, no guarantees, low overhead.
   - Which fits: file transfer / web / payments -> TCP; live video, voice, games, DNS queries -> UDP (latency over completeness).
   - Head-of-line blocking as the cost of ordering (QUIC/HTTP/3 builds reliability over UDP; concept only).
   - "Reliable" means retransmission and acknowledgements, not "the message is guaranteed to arrive if the network is down".
4. **TCP handshake and teardown**
   - SYN, SYN-ACK, ACK: synchronizes initial sequence numbers and confirms both directions work; why two messages are not enough.
   - Costs a round trip before data (why connection reuse/keep-alive matters).
   - FIN/ACK close, connection states at concept level only.
5. **DNS**
   - Maps names to IP addresses; hierarchical (root -> TLD -> authoritative), resolver does the work, results cached with TTL.
   - Caching layers (browser, OS, resolver) and why a DNS change "takes time to propagate" (TTL).
   - Usually UDP port 53 (TCP for large responses); record types A/AAAA/CNAME at concept level.
6. **What happens when you type a URL**
   - URL parse -> cache/HSTS check -> DNS resolution -> TCP connect -> TLS handshake (HTTPS) -> HTTP request -> server processing -> response -> browser parses HTML, fetches CSS/JS/images (more requests), renders.
   - Ordering questions: TLS happens after TCP connect and before the HTTP request; DNS happens before TCP.
   - Where caching can short-circuit steps (DNS cache, HTTP cache, CDN).
7. **HTTP basics**
   - Request/response, stateless; methods, headers, body; status code classes (1xx-5xx).
   - Common status codes by meaning: 200, 201, 204, 301 vs 302, 304, 400, 401 vs 403, 404, 409, 429, 500, 502/503.
   - 401 = not authenticated, 403 = authenticated but not allowed; 4xx = client should fix the request, 5xx = server problem.
8. **HTTP methods, safety and idempotency**
   - Safe (no state change): GET, HEAD, OPTIONS. Idempotent (same effect if repeated): GET, PUT, DELETE (+ safe ones). POST not idempotent; PATCH not guaranteed.
   - Why it matters: retries after timeouts, browser back/refresh resubmitting forms, proxies retrying.
   - Idempotency keys for payments (making POST safe to retry).
   - GET should not change state (crawlers, prefetch).
9. **REST design**
   - Resources as nouns in URLs, methods as verbs; path params identify, query params filter/sort/paginate.
   - Statelessness: each request carries what the server needs (auth token), helps horizontal scaling.
   - PUT (replace at known URI) vs POST (create, server picks id) vs PATCH (partial).
   - Choosing the right status code for a scenario (create -> 201, validation error -> 400, duplicate -> 409).
   - Pagination and versioning at concept level.
10. **State on top of stateless HTTP: cookies, sessions, tokens**
    - Cookie = small data the browser stores and sends back automatically to the same site; session = server-side state keyed by an id in a cookie; token (e.g. JWT) = self-contained signed claims.
    - Tradeoffs: server sessions are easy to revoke but need shared storage when scaled; JWTs avoid lookup but are hard to revoke before expiry; JWT is signed, not encrypted (payload readable).
    - Cookie flags: HttpOnly (JS cannot read; XSS mitigation), Secure (HTTPS only), SameSite (CSRF mitigation).
    - localStorage vs cookie: localStorage is not sent automatically, readable by any script on the page.
11. **HTTPS / TLS basics**
    - What TLS gives: confidentiality (encryption), integrity, server authentication (certificate signed by a trusted CA).
    - Asymmetric crypto used to authenticate and agree on a key; symmetric crypto for bulk data (why: speed).
    - What HTTPS does not hide: destination IP, and (typically) the hostname via SNI; does not make the site itself trustworthy or the server bug-free.
    - Certificate warnings mean authentication failed (possible man-in-the-middle).
12. **Same-origin policy and CORS**
    - Origin = scheme + host + port; same-origin policy stops scripts from reading responses from other origins.
    - CORS is the server opting in via response headers; the browser enforces it; curl/servers ignore it.
    - Simple requests are sent anyway (CORS controls reading the response, not sending); non-simple ones (e.g. JSON content type, custom headers, PUT/DELETE) trigger an OPTIONS preflight.
    - Credentials + wildcard origin is not allowed.
    - CORS is not a CSRF defense and not server protection.
13. **Caching and CDNs (light)**
    - Cache-Control, ETag/304 at concept level; CDN serves static content from edge locations to cut latency.
14. **Latency vs bandwidth**
    - Round trips dominate small requests (handshakes, DNS); bandwidth dominates large transfers. Why bundling, keep-alive and HTTP/2 multiplexing help.
15. **WebSockets / polling (light)**
    - When server push is needed (chat, live updates): WebSocket (persistent, bidirectional) vs polling.

### 3.3 Classic traps / distractors
- "UDP is unreliable so it is never used for anything important" (DNS, video calls, QUIC).
- "TCP guarantees delivery even if the connection breaks."
- "The handshake encrypts the connection" (TCP handshake has nothing to do with encryption; TLS is separate).
- "DNS is part of HTTP" / "DNS happens after the TCP connection".
- "HTTPS hides which website you visit from your ISP."
- "PUT and POST are interchangeable" / "DELETE is not idempotent because the second call returns 404" (idempotency is about server state, not identical responses).
- "Idempotent = safe."
- "401 and 403 mean the same thing" / "404 for every error".
- "CORS protects my API from attackers" / "fix CORS by adding headers in the client request".
- "Cookies and sessions are the same thing" / "JWT payload is encrypted".
- "HttpOnly makes cookies encrypted."
- "Ports identify computers; IP identifies the app."
- "Each TCP connection to a server needs a different server port."
- "OSI is the protocol stack the Internet actually runs" (it is a reference model; TCP/IP is what runs).

### 3.4 Exclude
- Memorizing all 7 OSI layer names in order as a standalone question, layer-number trivia ("which layer is session?").
- Subnetting arithmetic, CIDR math beyond "what /24 roughly means", VLANs, BGP/OSPF, routing table internals.
- TCP congestion control algorithm specifics (Reno vs Cubic, slow-start thresholds), window size math, header field bit layouts.
- TLS cipher suites, handshake message-by-message details, certificate chain formats, Diffie-Hellman math.
- Exact list of CORS-safelisted headers; exact cookie size limits; obscure status codes (418, 451, 207).
- HTTP/2 and HTTP/3 framing internals; DNSSEC; ARP packet details.

### 3.5 Sources
- https://github.com/alex/what-happens-when - collaborative deep answer to the URL question; stage list (input, URL parse, HSTS, DNS, ARP, socket, TLS, HTTP, server, rendering). License CC0 1.0 (public domain dedication).
- https://www.techinterview.org/post/3233476948/what-happens-after-you-hit-enter-networking/ - explains why interviewers ask the URL question; good framing.
- https://www.tryexponent.com/courses/solution-architect-interview/sa-technical/sa-url-browser - structured URL-question walkthrough; aimed above junior but the core sequence is the same.
- https://algomaster.io/learn/computer-networks/fundamentals-interview-questions - fundamentals list for networking interviews.
- https://towardsdatascience.com/all-you-should-know-about-computer-network-in-technical-interviews-5478f45368ac/ - scope summary for software (not network-engineer) interviews.
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS - authoritative CORS reference (simple vs preflight, credentials/wildcard, browser vs server roles); MDN content under Creative Commons (CC BY-SA 2.5 for prose per MDN's license page).
- https://roadmap.sh/questions/rest-api - REST beginner-to-advanced list; useful, but has imprecisions (conflates idempotency and safety, says headers "secure" data), which are good distractor material.
- https://restfulapi.net/rest-api-interview-questions/ - REST constraints and idempotency definitions; decent.
- https://www.datacamp.com/blog/rest-api-interview-questions - method/idempotency table, PATCH nuance (set vs increment), idempotency keys, CORS preflight; good.
- https://www.greatfrontend.com/blog/rest-api-interview-questions-for-frontend-devs - frontend angle on REST/idempotency; good.
- https://www.fullstack.cafe/blog/50-junior-web-developer-interview%20-questions-and-answers-ultimate-list-2018 - junior web list (cookies vs session vs local storage); dated, some trivia (cookie counts) to avoid.
- https://cs144.github.io/ - Stanford CS144 networking course; confirms core = encapsulation, reliability, TCP, packet switching, routing.
- https://github.com/donnemartin/system-design-primer - DNS, TCP vs UDP, HTTP, REST, CDN sections; License CC BY 4.0.

---

## 4. Databases and SQL

### 4.1 Weight: HIGH
Reason: SQL is asked of almost every junior (backend, full-stack, data, even Intel intern prep lists SQL); WHERE vs HAVING is the most-asked SQL question in one dataset of 612 real interviews, and transactions/indexes are standard follow-ups.

Note for our platform: SQL in the browser runs on SQLite. Keep MCQs dialect-neutral (standard SQL semantics), and avoid questions whose answer differs between SQLite, PostgreSQL and MySQL unless the question names the engine.

### 4.2 Concept map

1. **Relational model and keys**
   - Primary key (unique, not null, one per table), candidate key, composite key, surrogate vs natural key.
   - Foreign key: referential integrity; what happens on delete of a referenced row (restrict vs cascade vs set null, concept level).
   - UNIQUE constraint vs primary key (UNIQUE typically allows NULLs).
2. **Joins**
   - INNER vs LEFT vs RIGHT vs FULL OUTER vs CROSS; predicting row counts (one-to-many join multiplies rows; duplicates in join key).
   - LEFT JOIN + filter on the right table in WHERE turns it into an inner join; put the condition in ON to keep unmatched rows.
   - Anti-join: find rows with no match (LEFT JOIN ... WHERE right.id IS NULL, or NOT EXISTS).
   - Self join (employee-manager).
3. **Filtering and aggregation: WHERE vs GROUP BY vs HAVING**
   - Logical order of evaluation: FROM/JOIN -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY -> LIMIT; why a SELECT alias cannot be used in WHERE (in standard SQL).
   - WHERE filters rows before grouping; HAVING filters groups and can use aggregates.
   - Every non-aggregated SELECT column must be in GROUP BY (standard SQL; some engines are lax).
   - COUNT(*) vs COUNT(col) vs COUNT(DISTINCT col).
4. **NULL semantics (three-valued logic)**
   - NULL means unknown/missing; `= NULL` is never true, use IS NULL.
   - Comparisons with NULL yield UNKNOWN, and WHERE keeps only TRUE rows.
   - `NOT IN (subquery)` returns no rows if the subquery contains a NULL; NOT EXISTS is safe.
   - Aggregates ignore NULL (AVG over non-null values; SUM of all-NULL is NULL); COUNT(*) counts rows.
   - NULL in arithmetic/concatenation propagates; COALESCE as the fix.
   - GROUP BY puts NULLs in one group; ORDER BY placement of NULL is engine-dependent (exclude from MCQs).
5. **Subqueries, CTEs and window functions (junior level)**
   - Correlated vs uncorrelated subquery; EXISTS vs IN.
   - Window functions vs GROUP BY: window keeps rows (ROW_NUMBER, RANK vs DENSE_RANK for ties, running totals); "top N per group" pattern.
   - UNION vs UNION ALL (dedupe cost).
6. **Indexes and their cost**
   - What an index is (usually a B-tree, sorted, like a book index); turns a full scan into a lookup/range scan.
   - Cost: extra storage and slower INSERT/UPDATE/DELETE (each index maintained); not free to add everywhere.
   - When an index does not help: low selectivity columns, functions on the column (`WHERE LOWER(email) = ...`), leading-wildcard LIKE ('%abc'), small tables, query returns most rows.
   - Composite index column order: usable for a prefix of its columns (index on (a, b) helps `WHERE a = ?` and `WHERE a = ? AND b = ?`, not `WHERE b = ?` alone).
   - Primary key usually indexed automatically; foreign keys often not (engine-dependent).
   - Covering index / index-only scan at concept level; hash index good for equality not ranges.
7. **Transactions and ACID**
   - Transaction = unit of work that commits or rolls back as a whole (bank transfer example).
   - Atomicity (all or nothing), Consistency (constraints hold; app invariants must be encoded), Isolation (concurrent transactions do not see each other's partial work, to a chosen degree), Durability (committed data survives a crash; write-ahead log idea).
   - Autocommit: each statement is its own transaction unless you begin one.
8. **Isolation levels and anomalies**
   - Dirty read (seeing uncommitted data), non-repeatable read (same row changes between reads), phantom (same predicate returns new rows), lost update (concurrent read-modify-write), write skew (concept only).
   - Levels: Read Uncommitted, Read Committed, Repeatable Read, Serializable; higher isolation = fewer anomalies, more blocking/aborts.
   - Fixes for lost update: atomic `UPDATE ... SET x = x + 1`, `SELECT ... FOR UPDATE`, optimistic version column, or Serializable with retry.
   - Serializable may abort a transaction; retry the whole transaction.
   - Database deadlocks exist too (two transactions lock rows in opposite order) and the DB resolves them by aborting one (link to Concurrency).
9. **Normalization**
   - Purpose: remove redundancy and update/insert/delete anomalies.
   - 1NF (atomic values, no repeating groups), 2NF (no partial dependency on part of a composite key), 3NF (no transitive dependency on non-key attributes) at an intuitive level.
   - Denormalization tradeoff: faster reads, duplicated data to keep in sync.
   - Modeling: one-to-many via FK on the "many" side; many-to-many via a junction table.
10. **SQL vs NoSQL tradeoffs**
    - Relational: schema, joins, strong transactional guarantees, good for related data and complex queries.
    - Document / key-value / wide-column / graph stores: flexible schema, easier horizontal scaling for some access patterns, often weaker cross-entity transactions, data modeled around queries.
    - "Which fits" scenarios: financial ledger -> relational; session cache -> key-value; product catalog with varied attributes -> document; social graph -> graph.
    - NoSQL is not "no schema at all" (schema moves into the application) and not automatically faster.
11. **Query performance basics**
    - N+1 query problem from ORMs; fetch in one query or batch.
    - SELECT * cost, LIMIT/OFFSET pagination cost on deep pages (concept), EXPLAIN exists to see the plan.
12. **SQL injection (security crossover)**
    - Cause: building SQL by string concatenation with user input; fix: parameterized queries / prepared statements, not escaping by hand.
13. **DELETE vs TRUNCATE vs DROP, constraints in practice (light)**
    - Removes rows (filterable, logged) vs empties table vs removes table; keep as one or two questions max.

### 4.3 Classic traps / distractors
- `WHERE col = NULL` "finds null rows".
- `NOT IN` "behaves like NOT EXISTS" when NULLs are present.
- `COUNT(col)` "counts all rows"; AVG "treats NULL as 0".
- "HAVING is just a slower WHERE" / "WHERE can filter on COUNT(*)".
- "LEFT JOIN always returns exactly as many rows as the left table" (duplicates on the right multiply rows).
- Filter on the right table in WHERE "keeps unmatched left rows".
- "Adding an index always makes things faster" / "index every column".
- "An index on (a, b) speeds up queries on b alone."
- "Primary key and unique constraint are identical."
- "Consistency in ACID means replicas agree" (that is CAP consistency, a different notion).
- "Repeatable Read prevents every anomaly" / "Serializable means transactions run one at a time".
- "A transaction automatically prevents lost updates at any isolation level."
- "Normalization always improves performance."
- "NoSQL means no transactions ever" / "NoSQL is always faster and more scalable".
- "Escaping quotes is enough to prevent SQL injection."
- "UNION and UNION ALL return the same rows."
- "RANK and DENSE_RANK are the same" (gaps after ties).

### 4.4 Exclude
- BCNF/4NF/5NF formal definitions, functional-dependency closure algorithms, Armstrong's axioms.
- Relational algebra/calculus notation.
- B+ tree split mechanics, page layouts, buffer pool replacement, join algorithm cost formulas (hash vs sort-merge internals).
- Engine-specific behavior: MySQL vs PostgreSQL Repeatable Read differences, gap locks, MVCC vacuum, NULL sort order, GROUP BY laxness, SQLite type affinity.
- Two-phase commit, distributed transactions, CAP/PACELC proofs, replication lag tuning, sharding strategies (light mention in SQL vs NoSQL is fine).
- Stored procedures, triggers, cursors syntax; vendor-specific functions.
- Long query-writing tasks (those belong in our SQL coding problems, not MCQs; MCQs can show a short query and ask for its output).

### 4.5 Sources
- https://meetassist.io/interview-questions/sql - aggregate of 612 real SQL interviews; WHERE vs HAVING most asked; notes weak answers miss why HAVING exists. Good signal on frequency.
- https://prachub.com/resources/database-transactions-and-isolation-levels-interview-questions-with-real-anomalies - transactions, anomalies (dirty, non-repeatable, phantom, lost update, write skew), misconceptions (MVCC is not an isolation level; retry whole transaction; ACID does not enforce business rules). Very good; some content is above junior.
- https://www.prepnplaced.com/sql-interview-questions - freshers-to-5-years SQL list; highlights NOT IN with NULL subquery as decisive. Good.
- https://huru.ai/sql-interview-questions/ - SQL interview list covering HAVING, NULLs, keys, isolation levels; moderate.
- https://www.interviewpilot.app/blog/advanced-sql-interview-questions - isolation levels and anomalies; advanced, use only to set the upper bound.
- https://use-the-index-luke.com/sql/table-of-contents - Markus Winand's indexing guide; authoritative on B-tree, composite column order, functions in WHERE, LIKE, write cost. Free to read; copyrighted, paraphrase only.
- https://cs186berkeley.net/syllabus/ - Berkeley CS186; SQL, internals, NoSQL; confirms core curriculum.
- https://github.com/donnemartin/system-design-primer - RDBMS/ACID, SQL or NoSQL, replication, sharding, denormalization; License CC BY 4.0.

---

## Cross-cutting sources (career-level)
- https://www.reddit.com/r/cscareerquestions/comments/7x4jcu/is_operating_system_knowledge_important_for/ - thread on OS importance for internships (could not fetch; seen via search).
- https://www.reddit.com/r/cscareerquestions/comments/u7ffbe/topics_to_know_as_a_new_grad/ - new grad describing being caught out on fundamentals beyond LeetCode (seen via search).
- https://www.reddit.com/r/cscareerquestions/comments/j31tkj/how_important_is_networking_as_in_routing_not/ - students asking how much routing-level networking matters; consensus in snippet suggests low for SWE.
- https://static.glassdoor.com.mx/Interview/student-engineer-interview-questions-SRCH_KO0,16_IP127.htm - Glassdoor "student engineer" pages surfacing a thread-deadlock question.
- r/cscareerquestionsIL: searched but no indexed thread surfaced; treat Israeli evidence as coming from Glassdoor/Taro Israel-located reports and Israeli university syllabi.

---

## Recommended topic list and relative question counts

Assume a target bank of about 200 questions for this group. Counts scale linearly. Within each topic aim for roughly 30% easy, 50% medium, 20% hard; at least half should be scenario questions ("what happens if", "which fits", "what is printed / returned").

| # | Topic | Subtopic focus (priority order) | Share | ~Questions |
|---|---|---|---|---|
| 1 | Concurrency | race conditions and atomicity; deadlock (conditions, ordering fix); mutex vs semaphore; condition variables (`while`, lost wakeup); producer-consumer; livelock vs starvation; thread safety of compound ops; async/event loop races | 24% | 48 |
| 2 | Databases and SQL | NULL semantics; joins and row counts; WHERE vs HAVING / evaluation order; indexes and cost; transactions and ACID; isolation anomalies and lost update fixes; keys and normalization; SQL vs NoSQL fit; SQL injection; window functions basics | 28% | 56 |
| 3 | Networking and the web | URL journey ordering; TCP vs UDP fit; handshake purpose; DNS and caching/TTL; HTTP methods, safety vs idempotency; status codes by scenario; REST design; cookies / sessions / JWT and cookie flags; HTTPS/TLS guarantees and limits; same-origin and CORS | 26% | 52 |
| 4 | Operating systems | process vs thread (sharing, crash scope); virtual memory purpose; paging, TLB vs page fault; context switch cost; user vs kernel mode and syscalls; process states; fork/exec, zombie/orphan; scheduling tradeoffs (RR quantum, SJF starvation); memory layout (stack vs heap); thrashing | 22% | 44 |

Company tilt (for "practice for company X" filters): Intel / Nvidia / Mobileye / Check Point -> weight OS + Concurrency up (about 60% of their mix); Wix / monday.com -> weight Networking/Web + SQL up (about 65%); Microsoft / Amdocs -> balanced, SQL and concurrency slightly up.

Suggested daily-quiz rotation: one question each from Concurrency, SQL, Web, OS per day, cycling subtopics so each subtopic recurs about every two weeks.
