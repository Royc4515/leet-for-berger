# Hebrew style guide for the quiz bank (approved by the owner after the OOP pilot)

Audience: Israeli students and junior developers preparing for software job interviews.
Goal: natural, fluent Israeli tech Hebrew, as an Israeli interviewer would say it. Never a literal translation.

## Where the Hebrew lives
Each question in content/quiz/<topic>.json has a `he` block: {"q", "options" (same count and SAME order as English),
"why", "wrong" (null at exactly the English answer index)}. Code, answer and ref come from the English fields.

## Keep in English (never translate)
- Technical concepts: class, object, method, field, interface, abstract class, subclass, superclass, base class,
  subtype, constructor, reference, override/overload, overriding/overloading, inheritance, composition,
  encapsulation, polymorphism, dynamic dispatch, static/instance, public/private/protected/final, virtual,
  default method, cast, compile, runtime, compiler, getter/setter, state, invariant, API, bug, thread, process,
  lock, mutex, semaphore, deadlock, race condition, stack, heap, pointer, array, linked list, hash table, hash,
  index, transaction, commit, merge, rebase, branch, cache, load balancer, queue, request, response, status code,
  endpoint, test, mock, stub, unit test, integration test, Big-O names, IS-A/HAS-A, and any well-known term of art
  of each topic (SQL keywords, HTTP methods, Git commands, design-pattern names, SOLID principle names).
- Never translate public/private as ציבורי/פרטי, never "תתי-טיפוסים" (use subtypes).
- Code identifiers, class/method/variable names, literal values, program outputs: byte-identical.
  An option that is only code or output is copied unchanged.
- Inside mixed options translate connector words: "then" -> "ואז", "and" -> "ו-", "or" -> "או"; only code values stay English.

## Grammar with English terms
- Feminine: method ("method רצה"), inheritance, composition, default method, transaction, function.
- Masculine: class, object, field, reference, interface, thread, process, lock, index, cache, pointer, array, test, bug,
  request, query (also requests/queries, subquery, pull request): "ה-request הבא", "ה-query הזה", "queries יכולים", "שני requests".
- Verb patterns: "X עושה override ל-Y()", passive "Y() עברה override"; "X יורש מ-Y"; "class מממש interface";
  "עובר compile", "שגיאת compile"; "בזמן compile" and "ב-runtime"; "עושים cast של a ל-Dog"; "עושים commit/merge/rebase".
- Prefix letters attach with a hyphen: "ל-speak()", "ב-HashMap", "ה-thread".
- "מטיפוס X" for a declared/variable type; "מסוג X" for an object's actual class.

## Recurring stems
- What does this program print? -> מה התוכנית תדפיס?
- What does this print? / What is printed? -> מה יודפס?
- What does X print? -> מה X ידפיס?
- Which answer is correct? -> איזו תשובה נכונה?
- What fits best? / Which approach fits best? -> מה הכי מתאים? / איזו גישה הכי מתאימה?
- What is the root cause? -> מה שורש הבעיה?
- What happens? -> מה יקרה?
- Why? -> למה?
- An interviewer asks... -> מראיין שואל... (indefinite)
- A teammate -> חבר צוות
- Address the reader impersonally ("צריך", "מבקשים ממך"); never "אתה".

## Rules
- Meaning identical to English, including which option is correct and why each wrong option is wrong.
- Do not add hints; do not make the correct option longer or more precise than in English; keep options similar in length.
- No em dashes or en dashes (U+2014, U+2013), no exclamation marks, no invisible RTL/LTR marks.
