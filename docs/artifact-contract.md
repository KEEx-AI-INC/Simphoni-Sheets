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
