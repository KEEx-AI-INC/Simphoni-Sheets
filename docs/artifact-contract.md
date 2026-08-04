# SimphoniSheets artifact contract

Distribution artifacts are immutable and platform-specific:

- `collabora-linux-arm64`
- `calc-darwin-arm64`
- `calc-linux-amd64`
- `offline-ui`

Each lock entry must contain `version`, `sourceRevision`, `sha256`, `sizeBytes`,
`signature`, `signingKeyId`, `sbom`, `buildReceipt`, and `licenseManifest`.
Nucleus and Apex installers must fail closed when any field, file hash,
signature, target, or reviewed transformation differs.

Release manifests and provenance receipts must validate against
`contracts/artifact-manifest.schema.json` and
`contracts/build-receipt.schema.json`. Corresponding-source archives are
release assets and their paths, source revisions, and SHA-256 digests are part
of the signed manifest.

For hosted Collabora, the source set includes the active Gerrit `online`
monorepo release tag (including its `engine/` tree), the separate GitHub CODE
packaging revision used to construct the reference image, and the
Simphoni-Sheets branding/build source. The standalone LibreOffice core pin is
also retained for native Calc artifacts.

The native Calc artifact may contain the SimphoniSheets extension and branding.
It must not contain workbooks, prompts, model weights, credentials, private
keys, or machine-local paths. The Collabora artifact must bind to loopback and
rely on Caddy for public TLS and route separation.

An `unbuilt` lock is valid only for source development and cannot pass a
distribution or deployment gate.

## Hosted candidate publication

`.github/workflows/publish-collabora.yml` is a manual candidate-publication
lane. It accepts only `main` with the explicit `PUBLISH` confirmation and a
repository variable `SHEETS_PUBLISH_ENABLED=true`. Maintainers must configure
the protected `sheets-beta` environment before setting that variable. The lane
builds the pinned `linux/arm64` image, emits BuildKit SBOM/provenance and GitHub
build provenance attestations, signs the immutable digest with a keyless
Cosign identity, verifies that identity, and uploads a receipt. The GHCR tag
includes both the package version and source commit so retries cannot silently
reuse a different source revision.

The result remains a candidate. A reviewer must verify the digest, signature,
attestations, source archives, smoke evidence, and rollback target before
replacing the `unbuilt` entry in `artifacts/artifacts.lock.json`.
