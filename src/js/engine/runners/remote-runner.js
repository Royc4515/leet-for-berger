/**
 * Remote runner for Java, C++, C, C# and Go (docs/adr/0005-remote-runner.md).
 *
 * Same contract as WorkerRunner.run(): takes the user's code and the cases' args, returns one
 * RawResult per case, and judge() compares on the main thread. The program is the exact one the
 * CI verifier compiles (engine/programs/build.js), sent with the 15 cases' args as stdin to the
 * Cloudflare Worker, which forwards it to Piston. Expected values are never part of the request
 * (invariant 2): the server sees what a worker would see.
 *
 * Request  POST {url}/v1/execute/{language}   JSON, gzip when the browser can
 *          { files: [{ name, content }], stdin, args, timeLimitMs }
 * Response 200 { compile?: Stage, run?: Stage }   Stage = Piston's stage result:
 *          { stdout, stderr, code, signal, status, message, wall_time?, memory? }
 *          4xx/5xx { error }  (the Worker's or the gate's message)
 */
import { buildProgram, programStdin, JAVA_SUPPORT_FILES } from '../programs/build.js';
import { splitOutput } from '../programs/output.js';
import { LANGUAGES } from '../codegen.js';

/** Languages the remote runner executes. */
export const REMOTE_LANGUAGES = ['java', 'cpp', 'c', 'csharp', 'go'];

// Upper bound for one request, queueing and compile included; the server's own limits are lower.
const TOTAL_TIMEOUT_MS = 90_000;
const ERROR_LINES = 25;

/** Thrown when there is no verdict to show: the server is unreachable, busy or refused the request. */
export class RemoteUnavailableError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = 'RemoteUnavailableError';
    this.remote = true;
  }
}

const browserLoadText = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.text();
};

/** gzip a string when CompressionStream exists; the payload is mostly digits and compresses about 4x. */
async function gzip(text) {
  if (typeof CompressionStream === 'undefined') return null;
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export class RemoteRunner {
  /**
   * @param {object} opts
   * @param {string} opts.language one of REMOTE_LANGUAGES
   * @param {string} opts.url the Worker's base URL
   * @param {typeof fetch} [opts.fetchImpl]
   * @param {(url: string) => Promise<string>} [opts.loadText] loads the Java support files
   * @param {boolean} [opts.compress] gzip request bodies (default: when CompressionStream exists)
   * @param {() => Promise<string|null>} [opts.getToken] Turnstile token per request, when configured
   * @param {number} [opts.totalTimeoutMs]
   */
  constructor({ language, url, fetchImpl, loadText = browserLoadText, compress = true, getToken = null, totalTimeoutMs = TOTAL_TIMEOUT_MS }) {
    if (!REMOTE_LANGUAGES.includes(language)) throw new Error(`Not a remote language: ${language}`);
    this.language = language;
    this.url = url.replace(/\/+$/, '');
    this.fetch = fetchImpl ?? ((...a) => fetch(...a));
    this.loadText = loadText;
    this.compress = compress;
    this.getToken = getToken;
    this.totalTimeoutMs = totalTimeoutMs;
    this.remote = true;
    this.busy = false;
    this.abort = null;
    this.javaSupport = null;
  }

  /** Loads what a run needs before the first Run (the Java support files). */
  warmUp() {
    if (this.language !== 'java') return Promise.resolve();
    this.javaSupport ??= Promise.all(JAVA_SUPPORT_FILES.map((f) => this.loadText(new URL(`../programs/java/${f}`, import.meta.url).href)))
      .then((texts) => Object.fromEntries(JAVA_SUPPORT_FILES.map((f, i) => [f, texts[i]])))
      .catch((err) => {
        this.javaSupport = null; // a later run retries
        throw err;
      });
    return this.javaSupport;
  }

  /**
   * @param {object} job
   * @param {string} job.code
   * @param {{ id: number, args: unknown[] }[]} job.cases
   * @param {object} job.signature the problem's neutral signature
   * @param {number} job.timeLimitMs
   * @param {(status: string) => void} [job.onStatus]
   * @returns {Promise<import('../harness.js').RawResult[]>}
   * @throws {RemoteUnavailableError} when there is no verdict (unreachable, busy, refused)
   */
  async run({ code, cases, signature, timeLimitMs, onStatus }) {
    if (this.busy) throw new Error('A run is already in progress.');
    if (!signature) throw new Error('The remote runner needs the problem signature.');
    this.busy = true;
    const controller = new AbortController();
    this.abort = controller;
    const timer = setTimeout(() => controller.abort(new RemoteUnavailableError('The code server did not answer in time. Try again in a moment.')), this.totalTimeoutMs);
    try {
      onStatus?.('Sending to the code server...');
      const javaSupport = this.language === 'java' ? await this.warmUp() : undefined;
      const program = buildProgram(this.language, signature, code, { javaSupport });
      const payload = JSON.stringify({
        files: Object.entries(program.files).map(([name, content]) => ({ name, content })),
        stdin: programStdin(program, cases.map((c) => c.args), signature),
        args: program.args,
        timeLimitMs,
      });
      const headers = { 'Content-Type': 'application/json' };
      const zipped = this.compress ? await gzip(payload) : null;
      if (zipped) headers['Content-Encoding'] = 'gzip';
      const token = this.getToken ? await this.getToken() : null;
      if (token) headers['CF-Turnstile-Response'] = token;
      onStatus?.('Compiling and running on the server...');
      let res;
      try {
        res = await this.fetch(`${this.url}/v1/execute/${this.language}`, { method: 'POST', headers, body: zipped ?? payload, signal: controller.signal });
      } catch (err) {
        if (controller.signal.aborted) throw controller.signal.reason ?? err;
        throw new RemoteUnavailableError('The code server is unreachable. Check your connection and try again.');
      }
      const body = await res.json().catch(() => null);
      if (!res.ok || !body) throw new RemoteUnavailableError(refusal(res.status, body?.error));
      return mapResponse(body, cases, program);
    } catch (err) {
      if (controller.signal.aborted && controller.signal.reason instanceof RemoteUnavailableError) throw controller.signal.reason;
      throw err;
    } finally {
      clearTimeout(timer);
      this.busy = false;
      this.abort = null;
    }
  }

  /** Abandons a run in flight (the view is going away). The server finishes on its own limits. */
  cancel() {
    this.abort?.abort(new RemoteUnavailableError('Cancelled.'));
  }

  /** Growth timing needs a server-side timer: not offered for remote languages (ADR 0004). */
  cancelGrowth() {}
}

/** What the console says when the server answers without a verdict. */
function refusal(status, error) {
  if (status === 429) return 'Too many runs from your connection. Wait a minute and try again.';
  if (status === 413) return 'The program and its test data are too large for the code server.';
  if (status === 403) return 'The code server refused this site. The runner is configured for another address.';
  if (status === 503 || status === 502 || status === 504) return 'The code server is busy or offline. Try again in a moment.';
  return `The code server could not run this (HTTP ${status}${error ? `: ${error}` : ''}).`;
}

const lastLines = (text, n = ERROR_LINES) => {
  const lines = text.replace(/\s+$/, '').split('\n');
  return lines.length > n ? [`...`, ...lines.slice(-n)].join('\n') : lines.join('\n');
};

/**
 * Compiler messages refer to the generated file; point them at the user's code instead
 * (main.cpp:57 -> solution.cpp:3) and drop the server's directory.
 */
export function mapCompilerMessage(text, program) {
  const shown = LANGUAGES.find((l) => l.id === program.language)?.file ?? program.solutionFile;
  const offset = program.solutionLine - 1;
  const file = program.solutionFile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let out = text.replace(/(?:\/box\/submission|\/piston\/jobs\/[\w-]+)\//g, '');
  out = out.replace(new RegExp(`\\b${file}([:(])(\\d+)`, 'g'), (_, sep, line) => `${shown}${sep}${Math.max(1, Number(line) - offset)}`);
  if (program.language === 'csharp') {
    // dotnet build prints each error twice plus a summary; keep each error line once.
    const errors = [...new Set(out.split('\n').filter((l) => /\berror\b/i.test(l) && !/^\s*\d+ Error\(s\)/.test(l)).map((l) => l.replace(/\s*\[[^\]]*\.csproj\]\s*$/, '').trim()))];
    if (errors.length) out = errors.join('\n');
  }
  return lastLines(out, 40);
}

const SIGNALS = { SIGSEGV: 'Segmentation fault (SIGSEGV)', SIGABRT: 'Aborted (SIGABRT)', SIGFPE: 'Arithmetic error (SIGFPE)', SIGBUS: 'Bus error (SIGBUS)' };

/** Why the program stopped before finishing a case, as the console shows it. */
function stopReason(run, stderrText) {
  if (run.status === 'OL' || run.status === 'EL') return 'Output limit exceeded: print less (debug output goes to stderr, and it counts too).';
  const killed = run.signal === 'SIGKILL';
  if (killed && run.memory && run.memoryLimit && run.memory >= run.memoryLimit * 0.95) return `Memory limit exceeded (${Math.round(run.memoryLimit / 1e6)} MB).`;
  const trace = stderrText.trim();
  if (trace) return lastLines(trace);
  if (run.signal) return SIGNALS[run.signal] ?? `Killed by ${run.signal}${killed ? ' (often the memory limit)' : ''}.`;
  if (run.code !== null && run.code !== undefined && run.code !== 0) return `Exited with code ${run.code}.`;
  return run.message || 'The program stopped before this case finished.';
}

/**
 * Turns the server's answer into one RawResult per case.
 * Finished cases are 'ok' with their parsed value. The first unfinished case gets the reason the
 * program stopped (a timeout, a crash with its stack trace); the cases after it were never run.
 * A compile error is reported on every case, like a JavaScript syntax error.
 * @param {{ compile?: object, run?: object }} body
 * @param {{ id: number }[]} cases
 * @param {import('../programs/build.js').Program} program
 * @returns {import('../harness.js').RawResult[]}
 */
export function mapResponse(body, cases, program) {
  const { compile, run } = body;
  if (compile && (compile.code !== 0 || compile.status === 'TO')) {
    const msg = compile.status === 'TO' ? 'Compile timed out on the server.' : mapCompilerMessage(`${compile.stderr ?? ''}${compile.stdout ? `\n${compile.stdout}` : ''}`, program) || compile.message || 'Compile failed.';
    return cases.map((c) => ({ id: c.id, state: 'error', error: `Compile error:\n${msg}` }));
  }
  if (!run) return cases.map((c) => ({ id: c.id, state: 'error', error: 'The server returned no run result.' }));

  // The JVM announces the server's memory options on stderr; that line is not about the user's code.
  const stderr = (run.stderr ?? '').replace(/^NOTE: Picked up JDK_JAVA_OPTIONS:.*\n?/m, '');
  const out = splitOutput(run.stdout ?? '', stderr);
  const printed = (i) => [out.stdout[i], out.stderr[i]].filter((s) => s && s.trim()).join('\n') || undefined;
  return cases.map((c, i) => {
    if (i < out.results.length) {
      try {
        return { id: c.id, state: 'ok', actual: JSON.parse(out.results[i]), stdout: printed(i) };
      } catch {
        return { id: c.id, state: 'error', error: 'Unreadable result line. Print debug output to stderr (System.err, cerr, fprintf(stderr), os.Stderr, Console.Error): stdout carries the answers.', stdout: printed(i) };
      }
    }
    if (i > out.results.length) return { id: c.id, state: 'skipped' };
    if (run.status === 'TO' || (run.signal === 'SIGKILL' && run.message && /time/i.test(run.message))) {
      return { id: c.id, state: 'timeout', timeMs: run.wall_time ?? undefined, stdout: printed(i) };
    }
    const reason = i < out.started ? stopReason(run, out.stderr[i] ?? '') : stopReason(run, out.startup ?? '');
    return { id: c.id, state: 'error', error: reason, stdout: out.stdout[i] };
  });
}
