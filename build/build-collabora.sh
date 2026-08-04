#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
build_root="${1:?usage: build-collabora.sh BUILD_ROOT}"
"$repo_root/build/check-capacity.sh" "$build_root" 50

read_lock() {
  node -e 'const fs=require("fs"); const lock=JSON.parse(fs.readFileSync(process.argv[1])); let value=lock; for (const key of process.argv[2].split(".")) value=value[key]; if (!value) process.exit(2); process.stdout.write(value)' "$repo_root/upstream-lock.json" "$1"
}

base_digest="collabora/code@$(read_lock referenceCodeImage.linuxArm64Digest)"
collabora_revision="$(read_lock collaboraOnline.revision)"
packaging_revision="$(read_lock collaboraCodePackaging.revision)"
libreoffice_revision="$(read_lock libreOfficeCore.revision)"
product_version="$(node -p "require('$repo_root/package.json').version")"
if [ -n "$(git -C "$repo_root" status --porcelain --untracked-files=normal)" ]; then
  echo "Refusing to label an artifact from an uncommitted Simphoni-Sheets tree." >&2
  exit 5
fi
product_revision="$(git -C "$repo_root" rev-parse HEAD)"
image_tag="${SIMPHONI_SHEETS_IMAGE_TAG:-simphoni-sheets-collabora:${product_version}-arm64}"

resolved_platform="$(docker manifest inspect --verbose "$base_digest" | node -e 'let data=""; process.stdin.on("data", chunk => data += chunk); process.stdin.on("end", () => { const value=JSON.parse(data); process.stdout.write(`${value.Descriptor.platform.os}/${value.Descriptor.platform.architecture}`); });')"
if [ "$resolved_platform" != "linux/arm64" ]; then
  echo "Pinned Collabora base is $resolved_platform, expected linux/arm64." >&2
  exit 4
fi

docker build \
  --platform linux/arm64 \
  --build-arg "BASE_IMAGE=$base_digest" \
  --build-arg "SIMPHONI_SHEETS_VERSION=$product_version" \
  --build-arg "SIMPHONI_SHEETS_REVISION=$product_revision" \
  --build-arg "COLLABORA_SOURCE_REVISION=$collabora_revision" \
  --build-arg "COLLABORA_PACKAGING_REVISION=$packaging_revision" \
  --build-arg "LIBREOFFICE_SOURCE_REVISION=$libreoffice_revision" \
  --tag "$image_tag" \
  --file "$repo_root/Dockerfile.collabora" \
  "$repo_root"

image_id="$(docker image inspect "$image_tag" --format '{{.Id}}')"
mkdir -p "$build_root"
node - "$build_root/collabora-candidate.json" "$image_tag" "$image_id" "$base_digest" "$product_version" "$product_revision" "$collabora_revision" "$packaging_revision" "$libreoffice_revision" <<'NODE'
const fs = require('fs');
const [output, imageTag, imageId, baseDigest, version, revision, collaboraRevision, collaboraPackagingRevision, libreOfficeRevision] = process.argv.slice(2);
fs.writeFileSync(output, `${JSON.stringify({
  schema: 'ai.simphoni.sheets.collabora-candidate.v1',
  status: 'unsigned-candidate',
  imageTag,
  imageId,
  baseDigest,
  version,
  revision,
  collaboraRevision,
  collaboraPackagingRevision,
  libreOfficeRevision,
}, null, 2)}\n`);
NODE

echo "Built unsigned SimphoniSheets Collabora candidate: $image_tag ($image_id)"
echo "Production remains blocked until SBOM, source archive, receipt, signature, and immutable registry digest are present."
