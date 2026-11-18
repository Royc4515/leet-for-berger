# ADR 0005: Zero-cost remote runner for Java, C++, C, C# and Go

- Status: accepted
- Date: 2026-11-18

## Context

JavaScript, Python and SQL run in the browser (Web Workers, Pyodide, sql.js). Java, C++, C, C# and Go are editor-only: the verdict says "Language Not Supported Yet". The owner wants them to run for users, feel smooth, and cost nothing. Constraints that do not move:

- The site stays static on GitHub Pages (ADR 0001). No secret may ship to the client (invariant 10).
- Expected values never reach the code's runtime (invariant 2); hidden case data never reaches the UI (invariant 3).
- Practice mode keeps judging in the browser with `judge()`. Interview and battle stay as they are: a scored result needs server-side judging first (ROADMAP Phase 3).
- What CI proves must be what users run. `tests/solutions.test.js` already compiles a full program per language from the problem's signature; the server must run exactly those programs.

## Decision

```
browser (practice mode)
  RemoteRunner.run()                                 src/js/engine/runners/remote-runner.js
    buildProgram(lang, signature, code)              src/js/engine/programs/build.js (same as CI)
    POST {Worker}/v1/execute/{lang}  gzip JSON {files, stdin: the 15 cases' args, args, timeLimitMs}
  Cloudflare Worker (free plan)                      deploy/cloudflare-worker/src/index.js
    path + method, CORS allowlist, Content-Length cap, per-IP rate limit, optional Turnstile
    adds X-LFB-Secret, streams the body unparsed
  Workers VPC binding -> Cloudflare Tunnel (outbound only from the VM; no domain, no open port)
  Oracle Cloud Always Free VM, Ampere A1, 2 OCPU / 12 GB, Ubuntu 24.04
    gate (127.0.0.1:8080)                            deploy/piston/gate/gate.mjs
      constant-time secret check, gunzip with a cap, validation, pinned runtime and version,
      every limit set here, queue (2 active, 8 waiting), drops Piston's duplicate output
    Piston API (127.0.0.1:2000), isolate sandbox     deploy/piston/Dockerfile, docker-compose.yml
      our runtime packages: Java 21, GCC 12 (C, C++), .NET 8, Go 1.23
  <- {compile, run}: Piston's stage results
  mapResponse(): one RawResult per case            -> judge() in the page, as for JavaScript
```

1. **Execution engine: Piston, self-hosted.** Piston (MIT) runs each job in [isolate](https://github.com/ioi/isolate) (namespaces, cgroup v2 limits, a fresh uid). We build its API image from source at a pinned commit (`de2b365`) on Debian bookworm and Node 22, because the published image is x86-64 only and its Debian buster base can no longer install packages. One change to Piston: the JSON body limit goes from 100 kB to 64 MB.

2. **Our own runtime packages** (`deploy/piston/packages`), installed by `install-packages.sh` in Piston's on-disk format, because Piston's public package index only has x86-64 builds of old versions. Each downloads a pinned upstream archive for the VM's architecture and checks its published checksum. Their compile and run scripts are the verifier's commands; `tests/runner-deploy.test.js` fails if they drift.

   | Language | Piston index offers | We install | CI verifies with | Gap |
   |---|---|---|---|---|
   | Java | 15.0.2 (x86-64) | Temurin 21.0.13+9 | Temurin 21 | none |
   | C | gcc 10.2.0 | GCC 12.2.0 (Debian bookworm) `-O2 -std=c11` | Ubuntu GCC 13 | minor version; same flags |
   | C++ | gcc 10.2.0, no `-O2` | GCC 12.2.0 `-O2 -std=c++17` | Ubuntu GCC 13 | minor version; same flags |
   | C# | dotnet 5.0.201, mono 6.12 | .NET SDK 8.0.428 (runtime 8.0.34) | .NET 8.0.x | none |
   | Go | 1.16.2 (no generics) | Go 1.23.12 | Go 1.23 | none |

   GCC 13 is not packaged for bookworm; building it from source on 2 Arm cores takes hours. GCC 12 implements C11 and C++17 fully, and the CI flags are the same. `-O2` matters: Piston's own gcc package compiles without optimization, which would turn Accepted solutions into timeouts.

3. **One program, one process, 15 cases.** The page sends the full program (user code plus the generated harness; Java adds `Harness.java` and the structure classes, fetched from the site) and the 15 cases' arguments as stdin, never an expected value. The native programs follow a case protocol (`src/js/engine/programs/output.js`): a mark on stderr before each case, each result on its own line behind a mark on stdout, flushed per case. The page then knows which case crashed or ran out of time, shows the user's own prints per case (hidden cases redacted by `judge()` as always), and maps a stack trace to the case that threw. The verifier runs the same protocol, so CI covers it on every solution.

4. **Verdicts.** Compile error: every case `error` with the compiler's message, file and line mapped to the user's code (`main.cpp:57` becomes `solution.cpp:3`). Finished cases: `ok` with their value. The first unfinished case: `timeout` when Piston reports a time limit, otherwise `error` with that case's stderr (or the signal, the memory limit, the output limit). Cases after it: `skipped`. These are the states the worker runners produce, so `judge()` and the console need no change.

5. **Limits, set by the gate** (the client cannot raise them): run time = `timeLimitMs` x 2 + 1.5 s, at most 12 s (a problem's limit covers 15 cases on a CI x86 core; the Arm core is slower and the run includes JVM or .NET startup); compile 30 s; memory 1.5 GB run, 2 GB compile; output 16 MB; 128 to 256 processes; no network. Two jobs at a time on 2 OCPUs; 8 more wait; beyond that the gate answers 503.

6. **Transport.** A submit carries up to about 12 MB of test input (Versioned Store, Limited Paths); gzip brings that to about 3 MB. The Worker does not parse the body: parsing 12 MB of JSON would exceed the free plan's 10 ms CPU per request. It checks headers and the size, then streams. The gate parses and validates. Piston's stdin pipe loses data past the pipe buffer (`destroy()` right after `write()`), so the gate sends the cases as a file, `.stdin`, which the run scripts redirect.

7. **Configuration and fallback.** `src/js/config.js` holds the Worker URL (public) and an optional Turnstile site key; `window.LFB_REMOTE_RUNNER_URL` overrides it. Empty: nothing changes, the five languages stay editor-only with today's verdict. Configured: they run like JavaScript in practice mode, with a "Runs on the server" note in the toolbar. In interview and battle they stay editor-only with a message that says why. When the server is unreachable, busy or rate limited, the console says so in one line and nothing is recorded; JavaScript, Python and SQL are unaffected.

## Alternatives

| Option | Cost | Why it lost |
|---|---|---|
| Public Piston API (emkc.org) | $0 | Whitelist-only since 2026-02-15: requests without a key get HTTP 401 ("Public Piston API is now whitelist only as of 2/15/2026"); keys go to non-commercial educational projects on request, with no guarantee. |
| Judge0 hosted (RapidAPI) | Paid beyond a small daily quota | Costs money at any real use. Self-hosted Judge0 1.13 needs cgroup v1 (a kernel boot flag on Ubuntu 24.04), Postgres and Redis, and returns one submission per case. |
| WebAssembly in the browser | $0 | Whole toolchains in the tab: tens of MB per language (a JVM plus javac, Roslyn, the Go toolchain, clang), seconds of startup before the first Run, and memory a phone cannot spare. Not smooth. |
| Serverless containers (Cloud Run, Lambda) | Free tier, then metered | Needs a billing account without a hard spending cap: a bug or an abuser turns into a bill. Cold starts of multi-runtime images take seconds. |
| Our own sandbox (nsjail, bubblewrap) | $0 | Same hosting, more code to own. Piston already packages isolate, limits and an API. |
| Public HTTPS on the VM instead of a tunnel | $0 with a DuckDNS name | Kept as the documented fallback (`setup.sh public`, Caddy, port 443). It opens a port to the internet; the tunnel opens none and needs no domain. |

Oracle's Always Free tier is the only free offer with enough sustained CPU and memory for JVM and .NET compiles, and a Free Tier account cannot be charged: provisioning beyond the free limits is refused. Signup needs a card for identity verification only.

## Threat model

Assets: the VM (its CPU, memory and the tunnel token), other users' runs, the shared secret, the Cloudflare free quota. Attackers: anyone who submits code (all code is untrusted), anyone on the internet who calls the Worker directly.

| Threat | Control |
|---|---|
| Submitted code attacks the VM | isolate per job: separate PID, mount, IPC and network namespaces, its own uid, cgroup memory limit, process limit, CPU and wall time, file size and open file limits; the job's processes are killed and its box removed afterwards. Piston and the gate listen on 127.0.0.1 only. |
| Code reaches the network (scans, spam, data theft) | `PISTON_DISABLE_NETWORKING=true`: jobs get an empty network namespace. |
| Code exhausts the machine | Limits above, 2 concurrent jobs, a bounded queue, output capped at 16 MB, swap for compile spikes. |
| Package management abused (Piston's `/api/v2/packages` installs or removes runtimes) | Not reachable: the Worker only forwards `/v1/execute/{lang}`, the gate only serves that and `/v1/health`, Piston is on loopback. |
| Direct calls to the VM | Tunnel mode: no inbound port exists. Public mode: only 443, Caddy forwards two paths, and the gate rejects requests without the secret (constant-time check). |
| Secret leaks | The secret lives in the Worker (encrypted `wrangler secret`) and in `deploy/piston/secrets/gate.env` (mode 600, git-ignored). It never reaches the page, the repo or a response. Rotate: delete `gate.env`, re-run `setup.sh`, `wrangler secret put` the new value. |
| Abuse of the Worker by scripts | CORS stops other sites' pages, not scripts (they can send any Origin), so: per-IP rate limit (20 per minute per Cloudflare location), size caps, optional Turnstile (invisible, free; enable by setting `TURNSTILE_SECRET` and the site key), and Cloudflare's daily request cap as a global ceiling. |
| Expected values or hidden data exposed | The request holds code and args only (invariant 2, unit-tested). Per-case output is attached to RawResults and `judge()` strips hidden cases (invariant 3). Hidden inputs are in the client bundle anyway (Known limits); the server adds nothing to that. |
| Sandbox escape (kernel or isolate bug) | Piston needs a privileged container, so an escape is root on the VM. Accepted for a single-purpose VM that holds no user data: unattended security upgrades, SSH keys only, nothing else on the machine, and the setup is reproducible (`setup.sh`) so a compromised VM is destroyed and rebuilt. |

## Free tier limits and what happens past them

- **Cloudflare Workers Free**: 100,000 requests per day (a CORS preflight counts; the page caches it for 2 hours), 10 ms CPU per request (this Worker uses about 1 ms: it never parses the body), 100 MB request body. Past the daily cap, requests fail until 00:00 UTC; nothing is billed. The page shows "The code server is busy or offline". Rate limiting bindings, Workers VPC, Tunnel and Turnstile are free.
- **Oracle Always Free, Ampere A1**: 1,500 OCPU hours and 9,000 GB hours per month, which is 2 OCPUs and 12 GB running all month (cut from 4 / 24 on 2026-06-15); 200 GB block storage; 10 TB outbound per month. Usage cannot exceed this on a Free Tier account.
- **Capacity**: two jobs at a time. Measured on the local test chain (x86-64, 4 cores): 0.3 to 3.8 s per run for C, 0.7 to 4.0 s for Go, 1.3 to 3.7 s for Java, 1.7 to 4.8 s for C++, 3.6 to 7.4 s for C# (dotnet build dominates). Expect about 1.5x on the Arm cores. That is a few hundred runs per hour, ample for practice.

**Idle reclamation.** Oracle may reclaim an Always Free instance that is idle for 7 days: 95th-percentile CPU under 20%, network under 20% and memory under 20%. A practice runner is idle most of the time and will match. Mitigations, in order: (1) upgrade the tenancy to Pay As You Go: Always Free resources stay free, and the reclamation rule is written for Always Free tenancies (Oracle support and community reports say upgraded tenancies are not reclaimed; check the current wording at upgrade time). Keep a $1 budget alert, and create nothing outside the Always Free shapes. (2) Accept it: `setup.sh` rebuilds the VM in about 20 minutes, and while it is gone the site degrades to the "busy or offline" message for these five languages. We do not ship a load generator to look busy.

## Consequences

- `scripts/verify/harnesses.mjs`, `extra-types.mjs` and the Java files moved to `src/js/engine/programs/` (browser-safe; `harnesses.mjs` re-exports). The verifier and the page build byte-identical programs (`tests/programs.test.js`), and the native harnesses gained the case protocol (verified on all 128 algorithm problems in Java, C, C++, Go and C#).
- The runner contract gains an optional `signature` field in `run()` and a `cancel()` method on the remote runner; `getRunner(language, { session })` returns the editor-only runner inside interview and battle.
- C# feels slowest: `dotnet build` takes several seconds cold. Calling the Roslyn compiler directly would cut that, at the price of a compile command CI does not run today.
- Growth estimates (ADR 0004) stay JavaScript and Python only; timing on a shared server would need its own design.
- The server sees users' code. It keeps nothing: Piston deletes each job's box, and the gate logs only the language, duration, exit status and client IP (Docker's log rotation applies), never code or input.
- Phase 2 items still open: hidden tests and solutions served from a server, server-side judging for competitive modes.
