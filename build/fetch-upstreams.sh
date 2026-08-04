#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
build_root="${1:?usage: fetch-upstreams.sh BUILD_ROOT}"
"$repo_root/build/check-capacity.sh" "$build_root" 50

read_lock() {
  node -e 'const fs=require("fs"); const lock=JSON.parse(fs.readFileSync(process.argv[1])); let value=lock; for (const key of process.argv[2].split(".")) value=value[key]; if (!value) process.exit(2); process.stdout.write(value)' "$repo_root/upstream-lock.json" "$1"
}

fetch_one() {
  name="$1"
  repository="$2"
  revision="$3"
  fetch_ref="${4:-$revision}"
  target="$build_root/$name"
  if [ ! -d "$target/.git" ]; then
    if [[ "$fetch_ref" == refs/tags/* ]]; then
      git clone --depth=1 --no-checkout --branch "${fetch_ref#refs/tags/}" "$repository" "$target"
    else
      git clone --filter=blob:none --no-checkout "$repository" "$target"
    fi
  fi
  git -C "$target" remote set-url origin "$repository"
  git -C "$target" fetch --depth=1 origin "$fetch_ref"
  git -C "$target" checkout --detach "$revision"
  resolved="$(git -C "$target" rev-parse HEAD)"
  if [ "$resolved" != "$revision" ]; then
    echo "revision mismatch for $name: expected $revision, got $resolved" >&2
    exit 4
  fi
}

collabora_repository="$(read_lock collaboraOnline.repository)"
collabora_revision="$(read_lock collaboraOnline.revision)"
collabora_release_tag="$(read_lock collaboraOnline.releaseTag)"
packaging_repository="$(read_lock collaboraCodePackaging.repository)"
packaging_revision="$(read_lock collaboraCodePackaging.revision)"
libreoffice_repository="$(read_lock libreOfficeCore.repository)"
libreoffice_revision="$(read_lock libreOfficeCore.revision)"

fetch_one collabora-online "$collabora_repository" "$collabora_revision" "refs/tags/$collabora_release_tag"
fetch_one collabora-code-packaging "$packaging_repository" "$packaging_revision"
fetch_one libreoffice-core "$libreoffice_repository" "$libreoffice_revision"

echo "Pinned upstream source checkouts are ready under $build_root."
echo "Create deterministic source archives and record their SHA-256 values in the build receipt before release."
