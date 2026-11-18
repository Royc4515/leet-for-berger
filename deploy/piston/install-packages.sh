#!/usr/bin/env bash
# Installs the runtimes in deploy/piston/packages into Piston's package directory, the way
# Piston's own package manager would (pkg-info.json, cached .env, .ppman-installed), but from
# these pinned, checksum-verified definitions instead of the public package index, which only
# has x86-64 builds of old versions (Java 15, Go 1.16, .NET 5).
#
# Idempotent: a package whose definition is unchanged and already installed is skipped.
# Usually run inside the Piston container by setup.sh:
#   docker compose run --rm --entrypoint bash piston /lfb/install-packages.sh
# SRC and DST can be overridden for a local test (deploy/piston/dev/run-local.sh).
set -euo pipefail
SRC=${SRC:-/lfb/packages}
DST=${DST:-/piston/packages}
PLATFORM=${PLATFORM:-docker-debian}
OWNER=${OWNER:-piston}

for meta in "$SRC"/*/*/metadata.json; do
  def=$(dirname "$meta")
  name=$(basename "$(dirname "$def")")
  version=$(basename "$def")
  target="$DST/$name/$version"
  stamp=$(cat "$def"/* | sha256sum | cut -d' ' -f1)
  if [ -f "$target/.ppman-installed" ] && [ "$(cat "$target/.lfb-definition" 2>/dev/null)" = "$stamp" ]; then
    echo "up to date: $name $version"
    continue
  fi
  echo "installing: $name $version"
  rm -rf "$target"
  mkdir -p "$target"
  cp "$def"/* "$target"/
  (cd "$target" && bash ./build.sh)
  # pkg-info.json is metadata.json plus the platform, as Piston's package builder writes it.
  node -e '
    const fs = require("fs");
    const [meta, out, platform] = process.argv.slice(1);
    const info = JSON.parse(fs.readFileSync(meta, "utf8"));
    fs.writeFileSync(out, JSON.stringify({ ...info, build_platform: platform }, null, 2));
  ' "$def/metadata.json" "$target/pkg-info.json" "$PLATFORM"
  # Piston passes this environment to every job; computed once, like Piston does at install.
  (cd "$target" && env -i bash -c 'source ./environment; env' | grep -Ev '^(PWD|OLDPWD|_|SHLVL)=' > .env)
  echo "$stamp" > "$target/.lfb-definition"
  if id "$OWNER" >/dev/null 2>&1; then chown -R "$OWNER:$OWNER" "$target"; fi
  date +%s000 > "$target/.ppman-installed"
done
