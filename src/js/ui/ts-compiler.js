/**
 * TypeScript compiler for the runner, backed by the TypeScript service Monaco already runs for the
 * editor (a language-service worker with the full compiler). Reusing it costs no extra download.
 *
 * Each compile checks and emits a throwaway model holding toModuleSource(code); options and the
 * ambient types are set once, when Monaco loads (configureTypeScript in ui/editor.js).
 */
import { loadMonaco } from './editor.js';
import { toModuleSource, fromModuleOutput, compileErrors } from '../engine/typescript.js';

let seq = 0;

/**
 * The compiler, or null when Monaco (and so TypeScript) is unavailable.
 * @returns {Promise<import('../engine/runners/ts-runner.js').Compiler | null>}
 */
export async function loadTypeScriptCompiler() {
  const monaco = await loadMonaco();
  if (!monaco?.languages?.typescript) return null;
  return (code) => compile(monaco, code);
}

/** Monaco registers the TypeScript worker when it first meets a TypeScript model; wait for that. */
async function typeScriptWorker(monaco) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await monaco.languages.typescript.getTypeScriptWorker();
    } catch (err) {
      // Monaco rejects with a bare string until the language is set up.
      if (attempt >= 50) throw new Error(String(err?.message ?? err));
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

async function compile(monaco, code) {
  const source = toModuleSource(code);
  const uri = monaco.Uri.parse(`file:///lfb-judge-${++seq}.ts`);
  const model = monaco.editor.createModel(source, 'typescript', uri);
  try {
    const getWorker = await typeScriptWorker(monaco);
    const client = await getWorker(uri);
    const file = uri.toString();
    const [syntactic, semantic] = await Promise.all([client.getSyntacticDiagnostics(file), client.getSemanticDiagnostics(file)]);
    const errors = compileErrors(source, [...syntactic, ...semantic]);
    if (errors.length) return { errors };
    const out = await client.getEmitOutput(file);
    const js = out.outputFiles?.find((f) => f.name.endsWith('.js'))?.text;
    if (out.emitSkipped || js === undefined) throw new Error('TypeScript produced no JavaScript.');
    return { errors: [], js: fromModuleOutput(js) };
  } finally {
    model.dispose();
  }
}
