# SimphoniSheets

Canonical open-source source tree for SimphoniSheets.

> Public-beta source status: the application integrations and contracts are
> implemented, and local Collabora candidates can be built and smoke-tested.
> No production runtime artifact is promoted. All rollout flags remain off
> until signed Collabora/Calc artifacts and the acceptance evidence in
> `docs/rollout-gates.md` exist.

This repository owns the spreadsheet action contract, editor bridges, offline
library artifact, upstream source pins, branding patches, build provenance, and
artifact manifests. Runtime ownership remains intentionally split:

- `Simphoni-Web` hosts the cloud library at `/sheets`.
- `Simphoni-AI-Service-Bus` owns Sheets APIs, WOPI, and hosted SimpleCode actions.
- `Simphoni-Firebase` owns Firestore and Storage policy.
- `Simphoni-Nucleus` stages reviewed offline artifacts and owns local lifecycle.

## Default appearance: Violett Grid

SimphoniSheets defaults to the product-series **Violett Grid** treatment. New
workbooks use a `#1A151A` cell field, `#3C383D` grid, `#19171B` header/control
surface, and muted `#806E8E` lavender labels. The same palette is applied to
the Collabora branding patch and the offline library so cloud and local entry
points read as one product. See [docs/default-appearance.md](docs/default-appearance.md)
for the source-reference extraction and implementation boundary.

## Safety boundary

SimpleCode never sends arbitrary UNO, Python, macro, or shell commands to an
editor. It produces a `SheetPatchProposal` containing only the operations
defined in `contracts/sheet-patch-proposal.schema.json`. An editor bridge must
validate the proposal, re-check its base revision and selection hash, and wait
for explicit user approval before applying it as one undoable transaction.

## Development

```bash
npm test
npm run check
```

The checked-in upstream lock is immutable input to reviewed builds. Source
builds require at least 50 GiB of available working space:

```bash
./build/check-capacity.sh /path/to/build-root 50
./build/fetch-upstreams.sh /path/to/build-root
./build/build-collabora.sh /path/to/build-root
```

No production artifact is considered reviewed until `artifacts/artifacts.lock.json`
contains its SHA-256 digest, SBOM path, source revision, signature, and build
receipt.

Repository maintainers can manually run **Publish pinned Collabora candidate**
from the Actions tab on `main` and type `PUBLISH` after the protected
`sheets-beta` environment exists and the repository variable
`SHEETS_PUBLISH_ENABLED` is explicitly set to `true`. The guarded workflow
builds only `linux/arm64`, pushes a unique revision-qualified tag to GHCR,
attaches SBOM and provenance attestations, signs the immutable digest with
GitHub OIDC, and uploads an unpromoted candidate receipt. It never edits the
artifact lock or enables a runtime flag; promotion remains a separate reviewed
commit.

## License

Simphoni-owned code in this repository is available under MPL-2.0. Upstream
Collabora Online and LibreOffice components retain their original licenses and
notices. Simphoni trademarks are not licensed by the source-code license.
See `NOTICE` for the upstream source and corresponding-source obligations.
