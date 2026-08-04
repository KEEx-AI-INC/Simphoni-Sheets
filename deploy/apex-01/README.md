# Apex-01 hosted editor

This compose definition refuses to resolve without an explicit image value.
`SIMPHONI_SHEETS_IMAGE` must be the Simphoni-built `linux-arm64` image pinned by
digest in `artifacts/artifacts.lock.json`; tags and `latest` are not accepted by
the rollout review.

The only host bind is `127.0.0.1:9980`. Service Bus owns `/api/sheets/v1/*` and
`/wopi/*` on `127.0.0.1:5037`; Caddy owns public TLS.

The Collabora `coolforkit-caps` helper requires exactly the capability set in
the compose file: `CHOWN`, `FOWNER`, `MKNOD`, `SETGID`, `SETUID`, and
`SYS_CHROOT`. Do not add `no-new-privileges`; it suppresses the helper's file
capabilities and leaves the container unable to spawn a kit. This constraint
was verified against the pinned arm64 CODE 26.04.2.4 digest. The image contains
no `/bin/sh`, so health checks must invoke `coolwsd --probe` directly.
