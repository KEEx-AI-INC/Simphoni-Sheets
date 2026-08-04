# Release artifacts

This directory contains only review locks and schemas in source control. Large
binaries, signatures, source archives, SBOMs, and receipts are release assets,
not Git objects.

For each release, validate the artifact manifest against
`contracts/artifact-manifest.schema.json`, verify its detached signature with a
reviewed public key, and then copy the approved fields into
`artifacts.lock.json`. A null entry or the release value `unbuilt` must fail
every production installer and deployment workflow.
