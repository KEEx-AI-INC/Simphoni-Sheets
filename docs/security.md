# Security model

- Browser identity is a Firebase ID token resolved by Service Bus.
- WOPI tokens are short-lived and scoped to document, principal, role, and
  editor session. They are never used as Firebase Storage URLs.
- Public share secrets are generated from 256 bits of entropy and stored only
  as SHA-256 hashes. Public sessions cannot edit, copy, print, or download.
- Editor apply envelopes are Ed25519-signed, short-lived, nonce-bound, and
  accepted only after explicit approval and a fresh revision/selection check.
- Workbook blobs are immutable server revisions. Managed local blobs use
  AES-256-GCM with device or passphrase-sealed key material.
- Raw workbook contents, selections, prompts, keys, and share secrets are
  prohibited from logs, analytics, receipts, and crash reports.
- Macro-enabled files and arbitrary execution surfaces are disabled for beta.
- The hosted container drops all ambient capabilities and restores only the
  six capabilities required by Collabora's sandbox helper. Collabora cannot run
  with Docker `no-new-privileges`; the compensating boundaries are an immutable
  digest, non-root image user, loopback-only publish, Caddy TLS, WOPI allowlist,
  and no direct workbook-storage mount.
