#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
upstream_root="${1:?usage: archive-sources.sh UPSTREAM_ROOT OUTPUT_ROOT}"
output_root="${2:?usage: archive-sources.sh UPSTREAM_ROOT OUTPUT_ROOT}"
"$repo_root/build/check-capacity.sh" "$output_root" 20

read_lock() {
  node -e 'const fs=require("fs"); const lock=JSON.parse(fs.readFileSync(process.argv[1])); let value=lock; for (const key of process.argv[2].split(".")) value=value[key]; if (!value) process.exit(2); process.stdout.write(value)' "$repo_root/upstream-lock.json" "$1"
}

archive_checkout() {
  local checkout="$1"
  local revision="$2"
  local prefix="$3"
  local output="$4"
  local resolved
  resolved="$(git -C "$checkout" rev-parse HEAD)"
  if [ "$resolved" != "$revision" ]; then
    echo "Source checkout mismatch for $checkout: expected $revision, got $resolved." >&2
    exit 4
  fi
  git -C "$checkout" archive --format=tar --prefix="${prefix}/" "$revision" | gzip -n > "${output}.tmp"
  mv "${output}.tmp" "$output"
}

collabora_revision="$(read_lock collaboraOnline.revision)"
collabora_repository="$(read_lock collaboraOnline.repository)"
packaging_revision="$(read_lock collaboraCodePackaging.revision)"
packaging_repository="$(read_lock collaboraCodePackaging.repository)"
libreoffice_revision="$(read_lock libreOfficeCore.revision)"
libreoffice_repository="$(read_lock libreOfficeCore.repository)"
product_revision="$(git -C "$repo_root" rev-parse HEAD)"
if [ -n "$(git -C "$repo_root" status --porcelain --untracked-files=normal)" ]; then
  echo "Refusing to archive an uncommitted Simphoni-Sheets tree." >&2
  exit 5
fi

mkdir -p "$output_root"
collabora_archive="$output_root/collabora-online-${collabora_revision}.tar.gz"
packaging_archive="$output_root/collabora-code-packaging-${packaging_revision}.tar.gz"
libreoffice_archive="$output_root/libreoffice-core-${libreoffice_revision}.tar.gz"
product_archive="$output_root/simphoni-sheets-${product_revision}.tar.gz"

archive_checkout "$upstream_root/collabora-online" "$collabora_revision" "collabora-online-${collabora_revision}" "$collabora_archive"
archive_checkout "$upstream_root/collabora-code-packaging" "$packaging_revision" "collabora-code-packaging-${packaging_revision}" "$packaging_archive"
archive_checkout "$upstream_root/libreoffice-core" "$libreoffice_revision" "libreoffice-core-${libreoffice_revision}" "$libreoffice_archive"
git -C "$repo_root" archive --format=tar --prefix="simphoni-sheets-${product_revision}/" "$product_revision" | gzip -n > "${product_archive}.tmp"
mv "${product_archive}.tmp" "$product_archive"

node - "$output_root/source-archives.json" \
  "$collabora_archive" "$collabora_revision" "$collabora_repository" \
  "$packaging_archive" "$packaging_revision" "$packaging_repository" \
  "$libreoffice_archive" "$libreoffice_revision" "$libreoffice_repository" \
  "$product_archive" "$product_revision" "https://github.com/KEEx-AI-INC/Simphoni-Sheets.git" <<'NODE'
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const [output, ...values] = process.argv.slice(2);
const names = ['collabora-online', 'collabora-code-packaging', 'libreoffice-core', 'simphoni-sheets'];
const archives = names.map((name, index) => {
  const file = values[index * 3];
  const revision = values[index * 3 + 1];
  const repository = values[index * 3 + 2];
  const bytes = fs.readFileSync(file);
  return {
    name,
    repository,
    revision,
    file: path.basename(file),
    sizeBytes: bytes.length,
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
  };
});
fs.writeFileSync(output, `${JSON.stringify({
  schema: 'ai.simphoni.sheets.source-archives.v1',
  deterministicTar: true,
  gzipTimestamp: 0,
  archives,
}, null, 2)}\n`);
NODE

echo "Deterministic corresponding-source archives are ready in $output_root."
