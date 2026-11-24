/**
 * Quiz topics: display order, titles and one-line blurbs in English and Hebrew. The questions
 * live in content/quiz/<id>.json (source) and are built into per-language files the quiz view
 * fetches on demand (scripts/content/build-quiz.mjs). Pure data.
 *
 * Order follows how often the idea comes up for student and first-job interviews: the core
 * computer-science topics first, then practices, then languages.
 */

/** @typedef {{ id: string, group: 'core'|'practice'|'language', title: { en: string, he: string }, blurb: { en: string, he: string } }} QuizTopic */

/** @type {QuizTopic[]} */
export const QUIZ_TOPICS = [
  { id: 'oop', group: 'core', title: { en: 'OOP', he: 'OOP' }, blurb: { en: 'Polymorphism, inheritance vs composition, encapsulation, equality.', he: 'Polymorphism, inheritance מול composition, encapsulation, שוויון.' } },
  { id: 'data-structures', group: 'core', title: { en: 'Data structures', he: 'מבני נתונים' }, blurb: { en: 'Operation costs, hash tables, trees, heaps, which structure fits.', he: 'עלות פעולות, hash tables, עצים, heaps, איזה מבנה מתאים.' } },
  { id: 'algorithms', group: 'core', title: { en: 'Algorithms and Big-O', he: 'אלגוריתמים ו-Big-O' }, blurb: { en: 'Complexity, recursion, sorting, binary search, BFS and DFS, DP.', he: 'סיבוכיות, רקורסיה, מיון, binary search, BFS ו-DFS, DP.' } },
  { id: 'databases', group: 'core', title: { en: 'SQL and databases', he: 'SQL ומסדי נתונים' }, blurb: { en: 'Joins, NULL, indexes, transactions, keys and normalization.', he: 'Joins, NULL, indexes, transactions, keys ונרמול.' } },
  { id: 'concurrency', group: 'core', title: { en: 'Concurrency', he: 'Concurrency' }, blurb: { en: 'Race conditions, locks, deadlock, thread safety.', he: 'Race conditions, locks, deadlock, thread safety.' } },
  { id: 'operating-systems', group: 'core', title: { en: 'Operating systems', he: 'מערכות הפעלה' }, blurb: { en: 'Processes and threads, memory, system calls, scheduling.', he: 'Processes ו-threads, זיכרון, system calls, תזמון.' } },
  { id: 'networking', group: 'core', title: { en: 'Networking and the web', he: 'רשתות ו-Web' }, blurb: { en: 'HTTP, REST, TCP vs UDP, DNS, cookies, HTTPS.', he: 'HTTP, REST, TCP מול UDP, DNS, cookies, HTTPS.' } },
  { id: 'solid', group: 'practice', title: { en: 'SOLID and clean code', he: 'SOLID ו-Clean Code' }, blurb: { en: 'Which principle is broken, and which refactor fixes it.', he: 'איזה עיקרון נשבר, ואיזה refactor מתקן.' } },
  { id: 'design-patterns', group: 'practice', title: { en: 'Design patterns', he: 'תבניות עיצוב' }, blurb: { en: 'Singleton, Factory, Strategy, Observer and when to use them.', he: 'Singleton, Factory, Strategy, Observer ומתי להשתמש בהם.' } },
  { id: 'testing', group: 'practice', title: { en: 'Testing', he: 'בדיקות' }, blurb: { en: 'Unit vs integration, mocks and stubs, flaky tests.', he: 'Unit מול integration, mocks ו-stubs, flaky tests.' } },
  { id: 'git', group: 'practice', title: { en: 'Git', he: 'Git' }, blurb: { en: 'Commits and branches, merge vs rebase, conflicts, undo.', he: 'Commits ו-branches, merge מול rebase, conflicts, ביטול.' } },
  { id: 'security', group: 'practice', title: { en: 'Security basics', he: 'אבטחה בסיסית' }, blurb: { en: 'SQL injection, XSS, password hashing, authN vs authZ.', he: 'SQL injection, XSS, hashing לסיסמאות, authN מול authZ.' } },
  { id: 'system-design', group: 'practice', title: { en: 'System design basics', he: 'System Design בסיסי' }, blurb: { en: 'Scaling, load balancers, caches, CDNs and queues.', he: 'Scaling, load balancers, caches, CDN ו-queues.' } },
  { id: 'java', group: 'language', title: { en: 'Java', he: 'Java' }, blurb: { en: 'Pass by value, strings, collections, exceptions.', he: 'Pass by value, strings, collections, exceptions.' } },
  { id: 'python', group: 'language', title: { en: 'Python', he: 'Python' }, blurb: { en: 'Mutability, defaults and scope, generators, Python OOP.', he: 'Mutability, ברירות מחדל ו-scope, generators, OOP ב-Python.' } },
  { id: 'javascript', group: 'language', title: { en: 'JavaScript', he: 'JavaScript' }, blurb: { en: 'Closures, this, the event loop, promises and async.', he: 'Closures, this, ה-event loop, promises ו-async.' } },
  { id: 'c-cpp', group: 'language', title: { en: 'C and C++', he: 'C ו-C++' }, blurb: { en: 'Pointers, memory, undefined behavior, virtual and RAII.', he: 'Pointers, זיכרון, undefined behavior, virtual ו-RAII.' } },
  { id: 'bits', group: 'language', title: { en: 'Bits and numbers', he: 'ביטים ומספרים' }, blurb: { en: "Two's complement, masks, shifts, overflow, floating point.", he: "Two's complement, masks, shifts, overflow, floating point." } },
];

/** Languages the quiz is written in. */
export const QUIZ_LANGS = ['en', 'he'];
