/**
 * AI Mentor: Socratic hints, never full solutions.
 *
 * Provider contract (so the UI never cares where answers come from):
 *   reply({ message, problem, language, code, lastResult, history }) -> Promise<string>
 *
 * - ScriptedMentor: offline, walks the problem's hint ladder. Ships today.
 * - RemoteMentor: POSTs to a backend proxy that calls an LLM with SOCRATIC_SYSTEM_PROMPT.
 *   The API key must live on that server. Never ship a model key in this static client.
 */

export const SOCRATIC_SYSTEM_PROMPT = `You are a Socratic coding mentor inside a practice platform.
Rules:
- Never write the solution or any code longer than one line.
- Ask one guiding question at a time, grounded in the user's current code and failing test.
- If the user asks for the answer, refuse briefly and give a smaller next step instead.
- Prefer questions about invariants, edge cases, and complexity over hints about syntax.
- Keep replies under 80 words.`;

const ANSWER_SEEKING = /\b(solution|answer|full code|just give|write it|solve it)\b/i;

export class ScriptedMentor {
  constructor() {
    this.hintIndex = new Map(); // per problem, so switching problems does not skip hints
  }

  async reply({ message, problem, lastResult }) {
    if (ANSWER_SEEKING.test(message)) {
      return "I won't hand you the solution, that would cost you the part that sticks. Tell me: what does your code return for the smallest possible input, and is that what you expected?";
    }

    const failing = lastResult?.cases.find((c) => c.visible && c.status !== 'pass');
    if (failing && /\b(fail|wrong|why|bug|stuck)\b/i.test(message)) {
      if (failing.status === 'timeout') {
        return `Test ${failing.id} timed out. What is the time complexity of your approach, and how big can n get under the constraints?`;
      }
      if (failing.status === 'error') {
        return `Test ${failing.id} throws. Read the first line of the error: which value was not what your code assumed?`;
      }
      return `Look at test ${failing.id}: trace your code on that exact input by hand. At which step does it diverge from the expected output?`;
    }

    const i = this.hintIndex.get(problem.id) ?? 0;
    if (i >= problem.hints.length) {
      return 'You have every hint I can give without solving it for you. Write the invariant you think holds in one sentence, then check it against test 3.';
    }
    this.hintIndex.set(problem.id, i + 1);
    return `Hint ${i + 1}/${problem.hints.length}: ${problem.hints[i]}`;
  }
}

/** Placeholder for the backend-proxied LLM provider (roadmap Phase 3). */
export class RemoteMentor {
  constructor(endpoint = '/api/mentor') {
    this.endpoint = endpoint;
  }
  async reply(ctx) {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: SOCRATIC_SYSTEM_PROMPT,
        message: ctx.message,
        problemId: ctx.problem.id,
        language: ctx.language,
        code: ctx.code,
        failingCase: ctx.lastResult?.cases.find((c) => c.visible && c.status !== 'pass') ?? null,
      }),
    });
    if (!res.ok) throw new Error(`Mentor service error ${res.status}`);
    const data = await res.json();
    return data.reply;
  }
}
