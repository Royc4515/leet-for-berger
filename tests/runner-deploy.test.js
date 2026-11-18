// Consistency of the runner deploy kit (deploy/, ADR 0005) with the code that uses it: the
// server's compile and run scripts must be the verifier's commands, versions must agree across
// gate and packages, and everything must be pinned.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { buildProgram, JAVA_SUPPORT_FILES } from '../src/js/engine/programs/build.js';
import { REMOTE_LANGUAGES } from '../src/js/engine/runners/remote-runner.js';
import { LANGUAGES as WORKER_LANGUAGES } from '../deploy/cloudflare-worker/src/index.js';
import { RUNTIMES } from '../deploy/piston/gate/gate.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const DEPLOY = join(ROOT, 'deploy/piston');
const PACKAGES = join(DEPLOY, 'packages');
const read = (...p) => readFileSync(join(...p), 'utf8');
const javaSupport = Object.fromEntries(JAVA_SUPPORT_FILES.map((f) => [f, 'class X {}']));
const sig = { name: 'f', params: [{ name: 'n', type: 'int' }], returns: 'int' };

/** Package directory (relative to packages/) whose metadata provides this Piston language. */
function packageFor(pistonLanguage) {
  for (const name of readdirSync(PACKAGES)) {
    for (const version of readdirSync(join(PACKAGES, name))) {
      const meta = JSON.parse(read(PACKAGES, name, version, 'metadata.json'));
      const langs = meta.provides ? meta.provides.map((p) => p.language) : [meta.language];
      if (langs.includes(pistonLanguage)) return { dir: join(PACKAGES, name, version), meta, version };
    }
  }
  return null;
}

/** The command lines a script runs (comments, shebang and control lines dropped). */
const commands = (script) =>
  script
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && l !== 'shift' && !/^(case|esac|\*\))/.test(l));

test('the same five languages everywhere: client, Worker, gate', () => {
  assert.deepEqual([...REMOTE_LANGUAGES].sort(), [...WORKER_LANGUAGES].sort());
  assert.deepEqual([...REMOTE_LANGUAGES].sort(), Object.keys(RUNTIMES).sort());
});

test('every gate runtime has a package with that exact version', () => {
  for (const [lang, rt] of Object.entries(RUNTIMES)) {
    const pkg = packageFor(rt.language);
    assert.ok(pkg, `${lang}: no package provides ${rt.language}`);
    assert.equal(pkg.meta.version, rt.version, lang);
    assert.equal(pkg.version, rt.version, `${lang}: directory name`);
  }
});

test('server compile and run scripts are the verifier commands', () => {
  for (const lang of REMOTE_LANGUAGES) {
    const program = buildProgram(lang, sig, 'x', { javaSupport });
    const { dir } = packageFor(RUNTIMES[lang].language);
    const compileLines = commands(read(dir, 'compile'));
    const fileArgs = Object.keys(program.files).filter((f) => program.compile.includes(f));
    // A script may pass the request's file names as "$@" instead of listing them.
    const expectedCompile = [program.compile.join(' '), [...program.compile.filter((a) => !fileArgs.includes(a)), '"$@"'].join(' ')];
    assert.ok(
      compileLines.some((l) => expectedCompile.some((e) => l === e || l.endsWith(`) ${e} ;;`))),
      `${lang}: compile script does not run "${program.compile.join(' ')}":\n${compileLines.join('\n')}`,
    );
    const fixed = program.run.slice(0, program.run.length - program.args.length).join(' ');
    assert.ok(commands(read(dir, 'run')).includes(`exec ${fixed} "$@" < .stdin`), `${lang}: run script does not run "${fixed}"`);
  }
});

test('packages download only pinned, checksum-verified archives', () => {
  for (const name of readdirSync(PACKAGES)) {
    for (const version of readdirSync(join(PACKAGES, name))) {
      const build = read(PACKAGES, name, version, 'build.sh');
      const downloads = build.match(/curl [^\n]*/g) ?? [];
      for (const d of downloads) assert.ok(d.includes(version) || d.includes(version.replace(/\.(\d+)$/, '_$1')), `${name}: ${d}`);
      if (downloads.length) assert.match(build, /sha(256|512)sum -c/, `${name}: no checksum check`);
      for (const f of ['build.sh', 'compile', 'run', 'environment', 'metadata.json']) assert.ok(statSync(join(PACKAGES, name, version, f)).isFile(), `${name}/${f}`);
    }
  }
});

test('images are pinned by digest; no secrets in the kit', () => {
  const compose = read(DEPLOY, 'docker-compose.yml');
  for (const m of compose.matchAll(/image: (\S+)/g)) if (!m[1].startsWith('lfb-')) assert.match(m[1], /@sha256:[0-9a-f]{64}$/, m[1]);
  const docker = read(DEPLOY, 'Dockerfile');
  for (const m of docker.matchAll(/^FROM (\S+)/gm)) assert.match(m[1], /@sha256:[0-9a-f]{64}$/, m[1]);
  assert.match(docker, /PISTON_COMMIT=[0-9a-f]{40}/);
  assert.match(docker, /ISOLATE_COMMIT=[0-9a-f]{40}/);
  assert.match(compose, /env_file: \.\/secrets\/gate\.env/);
  const setup = read(DEPLOY, 'setup.sh');
  assert.match(setup, /chmod 600/);
});

test('the gate and Piston listen on loopback only', () => {
  const compose = read(DEPLOY, 'docker-compose.yml');
  assert.match(compose, /PISTON_BIND_ADDRESS: 127\.0\.0\.1:2000/);
  assert.match(compose, /GATE_LISTEN: 127\.0\.0\.1:8080/);
  assert.match(compose, /PISTON_DISABLE_NETWORKING: "true"/);
  assert.doesNotMatch(compose, /^\s+ports:/m, 'host networking: no published ports');
});

// Without this every dotnet process dies with SIGXFSZ under isolate's file-size limit on the Arm
// VM (seen in the first real deploy); the local stand-in has no such limit, so only this test guards it.
test('.NET runs with W^X off so it fits isolate\'s file-size limit', () => {
  const env = readFileSync(new URL('../deploy/piston/packages/dotnet/8.0.428/environment', import.meta.url), 'utf8');
  assert.match(env, /^export DOTNET_EnableWriteXorExecute=0$/m);
});
