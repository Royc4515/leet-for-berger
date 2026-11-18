#!/usr/bin/env bash
# DEVELOPMENT ONLY: the whole runner chain on one machine, without Docker, cgroup v2 or accounts.
#
#   real Piston API (pinned commit, same patch as the Dockerfile), packages installed by the real
#   install-packages.sh from deploy/piston/packages (downloads and checksums included), the real
#   gate, and the real Worker code served by worker-local.mjs. Only isolate is replaced, by
#   isolate-shim.mjs (no sandbox). Then smoke.mjs runs shipped solutions through gate and Worker.
#
# Usage: deploy/piston/dev/run-local.sh WORKDIR [smoke options...]
# Needs: node 22, npm, git, curl, bash. Ports 2000, 8080 and 8787 on 127.0.0.1.
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
DEPLOY=$(cd "$HERE/.." && pwd)
REPO=$(cd "$DEPLOY/../.." && pwd)
WORK=${1:?usage: run-local.sh WORKDIR [smoke options]}
shift
mkdir -p "$WORK"
WORK=$(cd "$WORK" && pwd)
COMMIT=de2b365ac759670a3a0d13ea208a0869a92c7e64

if [ ! -d "$WORK/piston" ]; then
  git clone -q https://github.com/engineer-man/piston.git "$WORK/piston"
  git -C "$WORK/piston" checkout -q "$COMMIT"
  sed -i "s/app.use(body_parser.json());/app.use(body_parser.json({ limit: '64mb' }));/" "$WORK/piston/api/src/index.js"
  (cd "$WORK/piston/api" && npm ci --omit=dev --no-audit --no-fund >/dev/null)
fi
mkdir -p "$WORK/bin" "$WORK/data/packages"
printf '#!/bin/sh\nexec node %s "$@"\n' "$HERE/isolate-shim.mjs" > "$WORK/bin/isolate"
chmod +x "$WORK/bin/isolate"
sed -i "s#^const ISOLATE_PATH = .*#const ISOLATE_PATH = '$WORK/bin/isolate';#" "$WORK/piston/api/src/job.js"

LFB_GCC_VERSION=$(gcc -dumpfullversion) SRC="$DEPLOY/packages" DST="$WORK/data/packages" PLATFORM=baremetal-local OWNER=none bash "$DEPLOY/install-packages.sh"

SECRET=${LFB_RUNNER_SECRET:-$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')}
pids=()
cleanup() { kill "${pids[@]}" 2>/dev/null || true; }
trap cleanup EXIT

(cd "$WORK/piston/api" && PATH="$WORK/bin:$PATH" LFB_SHIM_ROOT="$WORK/boxes" \
  PISTON_DATA_DIRECTORY="$WORK/data" PISTON_BIND_ADDRESS=127.0.0.1:2000 PISTON_LOG_LEVEL=WARN \
  PISTON_MAX_CONCURRENT_JOBS=2 PISTON_OUTPUT_MAX_SIZE=16000000 PISTON_MAX_PROCESS_COUNT=256 \
  PISTON_COMPILE_TIMEOUT=30000 PISTON_COMPILE_CPU_TIME=60000 PISTON_RUN_TIMEOUT=12000 PISTON_RUN_CPU_TIME=12000 \
  PISTON_COMPILE_MEMORY_LIMIT=2000000000 PISTON_RUN_MEMORY_LIMIT=1500000000 \
  node src > "$WORK/piston.log" 2>&1) &
pids+=($!)
LFB_RUNNER_SECRET="$SECRET" node "$DEPLOY/gate/gate.mjs" > "$WORK/gate.log" 2>&1 &
pids+=($!)
RUNNER_SECRET="$SECRET" GATE_URL=http://127.0.0.1:8080 ALLOWED_ORIGINS=http://localhost:5173 node "$HERE/worker-local.mjs" 8787 > "$WORK/worker.log" 2>&1 &
pids+=($!)
for _ in $(seq 1 50); do
  curl -fsS -H "X-LFB-Secret: $SECRET" http://127.0.0.1:8080/v1/health >/dev/null 2>&1 && break
  sleep 0.2
done
curl -fsS -H "X-LFB-Secret: $SECRET" http://127.0.0.1:8080/v1/health; echo

echo "== through the gate"
LFB_RUNNER_SECRET="$SECRET" node "$DEPLOY/smoke.mjs" --gate http://127.0.0.1:8080 "$@"
echo "== through the Worker"
node "$DEPLOY/smoke.mjs" --worker http://127.0.0.1:8787 --origin http://localhost:5173 "$@"
