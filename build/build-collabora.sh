#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
build_root="${1:?usage: build-collabora.sh BUILD_ROOT}"
"$repo_root/build/check-capacity.sh" "$build_root" 50

echo "This command prepares pinned source only; reviewed image construction is intentionally explicit."
echo "Read upstream-lock.json and clone the exact Collabora Online and LibreOffice revisions into:"
echo "  $build_root/collabora-online"
echo "  $build_root/libreoffice-core"
echo "Apply only reviewed patches from $repo_root/patches and record every transformation in the build receipt."
echo "Refusing to produce an unsigned or unreceipted public-beta artifact automatically."
exit 3
