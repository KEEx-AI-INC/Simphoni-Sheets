#!/usr/bin/env bash
set -euo pipefail

image="${1:?usage: smoke-collabora-image.sh IMAGE_DIGEST [HOST_PORT]}"
host_port="${2:-19985}"
container_name="simphoni-sheets-smoke-$$"
discovery_file="$(mktemp -t simphoni-sheets-discovery.XXXXXX)"
branding_file="$(mktemp -t simphoni-sheets-branding.XXXXXX)"
branding_css_file="$(mktemp -t simphoni-sheets-branding-css.XXXXXX)"
wordmark_file="$(mktemp -t simphoni-sheets-wordmark.XXXXXX)"
cool_file="$(mktemp -t simphoni-sheets-cool.XXXXXX)"

cleanup() {
  docker container stop --time 5 "$container_name" >/dev/null 2>&1 || true
  docker container rm "$container_name" >/dev/null 2>&1 || true
  find "$discovery_file" "$branding_file" "$branding_css_file" "$wordmark_file" "$cool_file" -delete 2>/dev/null || true
}
trap cleanup EXIT INT TERM

docker run --detach \
  --name "$container_name" \
  --platform linux/arm64 \
  --publish "127.0.0.1:${host_port}:9980" \
  --cap-drop ALL \
  --cap-add CHOWN \
  --cap-add FOWNER \
  --cap-add MKNOD \
  --cap-add SETGID \
  --cap-add SETUID \
  --cap-add SYS_CHROOT \
  --tmpfs /tmp:size=2g,mode=1777 \
  --env 'aliasgroup1=https://simphoni.ai:443,https://www.simphoni.ai:443' \
  --env 'server_name=sheets.simphoni.ai' \
  --env 'extra_params=--o:ssl.enable=false --o:ssl.termination=true --o:net.frame_ancestors=https://simphoni.ai https://www.simphoni.ai http://localhost:5173 http://127.0.0.1:5173' \
  "$image" >/dev/null

for _attempt in $(seq 1 18); do
  if curl -fsS "http://127.0.0.1:${host_port}/hosting/discovery" -o "$discovery_file"; then
    test -s "$discovery_file"
    docker inspect --format '{{.State.Health.Status}}' "$container_name" | grep -qx healthy
    browser_path="$(grep -Eo 'browser/[^/]+/cool\.html' "$discovery_file" | head -n 1)"
    browser_version="${browser_path#browser/}"
    browser_version="${browser_version%/cool.html}"
    test -n "$browser_version"
    curl -fsS "http://127.0.0.1:${host_port}/browser/${browser_version}/cool.html" -o "$cool_file"
    curl -fsS "http://127.0.0.1:${host_port}/browser/${browser_version}/branding.js" -o "$branding_file"
    curl -fsS "http://127.0.0.1:${host_port}/browser/${browser_version}/branding.css" -o "$branding_css_file"
    curl -fsS "http://127.0.0.1:${host_port}/browser/${browser_version}/images/simphoni-sheets-wordmark.svg" -o "$wordmark_file"
    grep -q "brandProductName = 'SimphoniSheets'" "$branding_file"
    grep -q 'simphoni_brand=1f1a20' "$cool_file"
    grep -q -- '--simphoni-sheets-violet' "$branding_css_file"
    grep -q '<title id="title">SimphoniSheets</title>' "$wordmark_file"
    echo "Collabora discovery and image health passed for $image."
    exit 0
  fi
  if [ "$(docker inspect --format '{{.State.Status}}' "$container_name")" = "exited" ]; then
    break
  fi
  sleep 5
done

docker inspect --format '{{json .State}}' "$container_name" >&2 || true
docker logs --tail 120 "$container_name" >&2 || true
exit 1
