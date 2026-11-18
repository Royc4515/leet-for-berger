#!/usr/bin/env bash
# Go 1.23.12, the CI toolchain's minor version (actions/setup-go, go-version 1.23).
# Runs in the package directory; checksums are go.dev's published SHA-256 values.
set -euo pipefail
case "$(uname -m)" in
  aarch64) arch=arm64; sha=52ce172f96e21da53b1ae9079808560d49b02ac86cecfa457217597f9bc28ab3 ;;
  x86_64) arch=amd64; sha=d3847fef834e9db11bf64e3fb34db9c04db14e068eeb064f49af747010454f90 ;;
  *) echo "unsupported architecture $(uname -m)" >&2; exit 1 ;;
esac
curl -fsSL "https://go.dev/dl/go1.23.12.linux-${arch}.tar.gz" -o go.tar.gz
echo "$sha  go.tar.gz" | sha256sum -c -
tar xzf go.tar.gz
rm go.tar.gz

# Since Go 1.20 the standard library ships as source and compiles into the build cache on first
# use: about 15 s on two Arm cores for what the harness imports. Every job starts with an empty
# /tmp, so warm a seed cache here, at the final path, and the compile script copies it (about 0.2 s).
export GOROOT=$PWD/go PATH=$PWD/go/bin:$PATH GOCACHE=$PWD/gocache GOPATH=$PWD/gopath GOTOOLCHAIN=local GOFLAGS=-buildvcs=false
mkdir -p warm
cat > warm/main.go <<'GO'
package main

import (
	"bufio"
	"container/heap"
	"container/list"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"math/bits"
	"math/rand"
	"os"
	"reflect"
	"slices"
	"sort"
	"strconv"
	"strings"
	"unicode"
)

var _ = []any{bufio.NewReader, heap.Init, list.New, json.Marshal, fmt.Println, io.ReadAll, math.Abs, bits.Len, rand.Intn, os.Exit, reflect.ValueOf, slices.Sort[[]int], sort.Ints, strconv.Itoa, strings.Split, unicode.IsSpace}

func main() {}
GO
(cd warm && go build -o /dev/null main.go)
rm -rf warm gopath
chmod -R a+rX gocache
