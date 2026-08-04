# Apex-01 hosted editor

This compose definition refuses to resolve without an explicit image value.
`SIMPHONI_SHEETS_IMAGE` must be the Simphoni-built `linux-arm64` image pinned by
digest in `artifacts/artifacts.lock.json`; tags and `latest` are not accepted by
the rollout review.

The only host bind is `127.0.0.1:9980`. Service Bus owns `/api/sheets/v1/*` and
`/wopi/*` on `127.0.0.1:5037`; Caddy owns public TLS.
