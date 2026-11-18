#!/usr/bin/env bash
# C and C++ use the image's GCC (Debian bookworm, 12.2.0; deploy/piston/Dockerfile installs it).
# Nothing to download: this only checks that the compiler is the one the package claims.
# LFB_GCC_VERSION exists for deploy/piston/dev/run-local.sh, which uses the host's compiler.
set -euo pipefail
want=${LFB_GCC_VERSION:-12.2.0}
gcc -dumpfullversion | grep -qx "$want"
g++ -dumpfullversion | grep -qx "$want"
