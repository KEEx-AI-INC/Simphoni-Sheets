import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const schema = JSON.parse(fs.readFileSync(path.join(root, 'contracts/sheet-patch-proposal.schema.json'), 'utf8'));
const artifactSchema = JSON.parse(fs.readFileSync(path.join(root, 'contracts/artifact-manifest.schema.json'), 'utf8'));
const receiptSchema = JSON.parse(fs.readFileSync(path.join(root, 'contracts/build-receipt.schema.json'), 'utf8'));
const upstream = JSON.parse(fs.readFileSync(path.join(root, 'upstream-lock.json'), 'utf8'));
const artifacts = JSON.parse(fs.readFileSync(path.join(root, 'artifacts/artifacts.lock.json'), 'utf8'));

if (schema.title !== 'SheetPatchProposal') throw new Error('unexpected proposal schema');
if (artifactSchema.title !== 'SimphoniSheetsArtifactManifest') throw new Error('unexpected artifact manifest schema');
if (receiptSchema.title !== 'SimphoniSheetsBuildReceipt') throw new Error('unexpected build receipt schema');
for (const entry of [upstream.collaboraOnline, upstream.libreOfficeCore]) {
  if (!/^[a-f0-9]{40}$/.test(entry.revision)) throw new Error(`unpinned upstream: ${entry.repository}`);
}
if (artifacts.release !== 'unbuilt' && Object.values(artifacts.artifacts).some((entry) => !entry?.sha256 || !entry?.signature || !entry?.sbom || !entry?.buildReceipt)) {
  throw new Error('reviewed releases require digest, signature, SBOM, and receipt for every artifact');
}
console.log('SimphoniSheets contract checks passed.');
