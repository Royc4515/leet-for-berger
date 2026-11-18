// The program builder moved to src/js/engine/programs/ so the browser's remote runner sends the
// exact programs CI verifies (docs/adr/0005-remote-runner.md). Re-exported for existing imports.
export { buildHarness, buildProgram, encodeCases, programStdin, NATIVE_LANGUAGES, JAVA_SUPPORT_FILES } from '../../src/js/engine/programs/build.js';
export { splitOutput } from '../../src/js/engine/programs/output.js';
