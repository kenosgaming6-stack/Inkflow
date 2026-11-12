#!/usr/bin/env bash
# Runs every browser test against the app folder (public/), then the main book test against the
# one-file build (the index.html you upload). Prints "passed" or the failing checks for each.
# Needs python3, node, and Playwright with Chromium installed globally:
#   npm install -g playwright && npx playwright install chromium
set -u
cd "$(dirname "$0")/.."
mkdir -p tests/out/single
python3 tools/build-single.py tests/out/single/index.html >/dev/null || { echo "one-file build failed"; exit 1; }
python3 -m http.server 8768 --bind 127.0.0.1 --directory public >/dev/null 2>&1 & A=$!
python3 -m http.server 8767 --bind 127.0.0.1 --directory tests/out/single >/dev/null 2>&1 & B=$!
trap 'kill $A $B 2>/dev/null' EXIT
sleep 1
fail=0
run() { # name, then the command
  printf '%-12s ' "$1"; shift
  if out=$("$@" 2>&1); then echo "passed"; else echo "FAILED"; echo "$out" | grep -E 'FAIL|CRASH' | sed 's/^/    /'; fail=1; fi
}
for t in book sms count-check keypad photos upgrade motion voice counter screens; do run "$t" node "tests/$t.js"; done
run one-file env URL=http://127.0.0.1:8767/ node tests/book.js
exit $fail
