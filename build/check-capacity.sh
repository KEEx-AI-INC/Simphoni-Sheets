#!/usr/bin/env bash
set -euo pipefail

build_root="${1:?usage: check-capacity.sh BUILD_ROOT [MIN_GIB]}"
minimum_gib="${2:-50}"
mkdir -p "$build_root"
available_kib="$(df -Pk "$build_root" | awk 'NR==2 {print $4}')"
required_kib="$((minimum_gib * 1024 * 1024))"
if [ "$available_kib" -lt "$required_kib" ]; then
  available_gib="$((available_kib / 1024 / 1024))"
  echo "SimphoniSheets build blocked: ${available_gib} GiB available; ${minimum_gib} GiB required." >&2
  exit 2
fi
echo "SimphoniSheets build capacity gate passed."
