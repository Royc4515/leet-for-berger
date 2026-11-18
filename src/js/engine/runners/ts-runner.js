/**
 * TypeScript runner: type-check and transpile, then run as JavaScript (engine/typescript.js).
 *
 * The compiler is injected (`loadCompiler`) so this module stays free of Monaco; in the browser it
 * is the TypeScript service the editor already loaded (ui/ts-compiler.js), so TypeScript costs no
 * extra download. Without it (Monaco failed to load) the run reports that honestly per case.
 */

/** Shown under every compile error, so the policy is visible where it applies. */
export const TYPE_CHECK_NOTE = 'TypeScript is type-checked before it runs, as on LeetCode: a type error is a Compile Error. Line numbers refer to your code.';

/** Shown when no compiler is available. */
export const NO_COMPILER_MESSAGE =
  'TypeScript runs on the TypeScript service of the code editor, which could not load (offline?). Reload the page to run TypeScript, or use JavaScript.';

/**
 * @typedef {{ errors: string[], js?: string }} CompileOutput
 * @typedef {(code: string) => Promise<CompileOutput>} Compiler
 */

export class TypeScriptRunner {
  /**
   * @param {object} opts
   * @param {import('./worker-runner.js').WorkerRunner} opts.js runs the transpiled code
   * @param {() => Promise<Compiler | null>} opts.loadCompiler null when no compiler can load
   */
  constructor({ js, loadCompiler }) {
    this.js = js;
    this.loadCompiler = loadCompiler;
    this.compiler = null;
    this.last = null; // { code, output }: Submit then growth timing compile the same code once
    this.cancelled = false;
  }

  /** Starts loading the compiler; never rejects. */
  warmUp() {
    this.compiler ??= this.loadCompiler().catch(() => null);
    return this.compiler.then(() => {});
  }

  /** @returns {Promise<CompileOutput | null>} null when no compiler is available */
  async #compile(code) {
    if (this.last?.code === code) return this.last.output;
    this.warmUp();
    const compile = await this.compiler;
    if (!compile) return null;
    const output = await compile(code);
    this.last = { code, output };
    return output;
  }

  /**
   * Same contract as WorkerRunner.run: one RawResult per case.
   * @param {Parameters<import('./worker-runner.js').WorkerRunner['run']>[0]} job
   */
  async run(job) {
    const { cases, onStatus } = job;
    onStatus?.('Compiling TypeScript...');
    let output;
    try {
      output = await this.#compile(job.code);
    } catch (err) {
      const error = `The TypeScript compiler failed: ${err?.message ?? err}`;
      return cases.map((c) => ({ id: c.id, state: 'error', error }));
    }
    if (!output) return cases.map((c) => ({ id: c.id, state: 'unsupported', error: NO_COMPILER_MESSAGE }));
    if (output.errors.length) {
      const error = `${output.errors.join('\n')}\n\n${TYPE_CHECK_NOTE}`;
      return cases.map((c) => ({ id: c.id, state: 'compile-error', error }));
    }
    return this.js.run({ ...job, code: output.js });
  }

  /**
   * Growth timing on the transpiled code (docs/adr/0004-complexity-feedback.md).
   * @param {Parameters<import('./worker-runner.js').WorkerRunner['measureGrowth']>[0]} job
   */
  async measureGrowth(job) {
    this.cancelled = false;
    let output;
    try {
      output = await this.#compile(job.code);
    } catch (err) {
      return { samples: [], error: String(err?.message ?? err) };
    }
    // The JavaScript runner clears its own cancel flag when it starts, so a cancel that arrived
    // while compiling is honored here.
    if (this.cancelled) return { samples: [], cancelled: true };
    if (!output) return { samples: [], error: NO_COMPILER_MESSAGE };
    if (output.errors.length) return { samples: [], error: output.errors[0] };
    return this.js.measureGrowth({ ...job, code: output.js });
  }

  /** Stops a growth measurement, including one still compiling. */
  cancelGrowth() {
    this.cancelled = true;
    this.js.cancelGrowth();
  }
}
