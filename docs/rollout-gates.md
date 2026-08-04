# Public beta gates

All user-facing runtime flags default off. Promotion requires evidence for:

- signed/digest-pinned hosted and native artifacts, SBOMs, source archives, and
  reproducible build receipts;
- 50 GiB build capacity and at least 20 GiB retained Apex runtime capacity;
- Docker runtime supervision, DNS, TLS, Caddy, loopback-only 9980, and rollback;
- WOPI lock/save/crash recovery and immutable revision restoration;
- two-account collaboration, named roles, invitation resolution, and revoked
  anonymous view-only links with copy/print/download disabled;
- hosted SimCredits preflight/metering and zero-credit air-gapped local AI;
- macOS arm64 and Linux amd64 encrypted-vault/native-Calc acceptance;
- malicious archive, macro, IDOR, token replay, forged envelope, iframe-origin,
  and content-free log security tests.

An unbuilt or null entry in `artifacts/artifacts.lock.json` is an automatic stop.
