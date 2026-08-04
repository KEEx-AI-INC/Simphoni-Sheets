import { assertSheetPatchProposal } from '../../packages/contracts/src/index.js';

export const MESSAGE_VERSION = 1;
export const SIMPHONI_SHEETS_NAMESPACE = 'ai.simphoni.sheets';

export function createSelectionSnapshot({ documentId, revision, sheetId, range, selectionHash, cells }) {
  if (!documentId || !revision || !sheetId || !range || !selectionHash) {
    throw new TypeError('selection snapshot identity is incomplete');
  }
  if (!Array.isArray(cells) || cells.length > 10_000) {
    throw new RangeError('selection snapshot exceeds the 10,000-cell beta limit');
  }
  return {
    namespace: SIMPHONI_SHEETS_NAMESPACE,
    version: MESSAGE_VERSION,
    type: 'selection.snapshot',
    documentId,
    revision,
    sheetId,
    range,
    selectionHash,
    cells,
  };
}

export function validateApplyEnvelope(envelope, context) {
  if (!envelope || envelope.namespace !== SIMPHONI_SHEETS_NAMESPACE || envelope.version !== MESSAGE_VERSION) {
    throw new TypeError('invalid SimphoniSheets apply envelope');
  }
  if (envelope.type !== 'proposal.apply' || !envelope.approvedByUser || !envelope.signature) {
    throw new TypeError('proposal is not approved or signed');
  }
  assertSheetPatchProposal(envelope.proposal);
  if (Date.parse(envelope.expiresAt) <= Date.now()) throw new Error('apply envelope expired');
  if (envelope.proposal.documentId !== context.documentId) throw new Error('document changed');
  if (envelope.proposal.baseRevision !== context.revision) throw new Error('base revision changed');
  if (envelope.proposal.target.selectionHash !== context.selectionHash) throw new Error('selection changed');
  return envelope.proposal;
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

function decodeBase64(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/').replace(/\s+/g, '');
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function pemBytes(value) {
  return decodeBase64(value.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----/g, ''));
}

export async function verifyAndValidateApplyEnvelope(envelope, context, trustedKey) {
  const proposal = validateApplyEnvelope(envelope, context);
  if (!trustedKey || trustedKey.algorithm !== 'Ed25519' || trustedKey.keyId !== envelope.signingKeyId) {
    throw new Error('apply signing key is not trusted');
  }
  const unsigned = { ...envelope };
  delete unsigned.signature;
  const format = trustedKey.format === 'spki-pem' ? 'spki' : 'raw';
  const keyBytes = format === 'spki' ? pemBytes(trustedKey.publicKey) : decodeBase64(trustedKey.publicKey);
  const key = await globalThis.crypto.subtle.importKey(format, keyBytes, { name: 'Ed25519' }, false, ['verify']);
  const valid = await globalThis.crypto.subtle.verify(
    { name: 'Ed25519' }, key, decodeBase64(envelope.signature), new TextEncoder().encode(canonical(unsigned)),
  );
  if (!valid) throw new Error('apply envelope signature is invalid');
  return proposal;
}

export async function applyProposalAtomically(proposal, adapter) {
  assertSheetPatchProposal(proposal);
  if (!adapter || typeof adapter.beginUndoTransaction !== 'function' || typeof adapter.applyOperation !== 'function') {
    throw new TypeError('spreadsheet adapter does not support atomic undo transactions');
  }
  const transaction = await adapter.beginUndoTransaction(`SimpleCode: ${proposal.proposalId}`);
  try {
    for (const operation of proposal.operations) await adapter.applyOperation(transaction, operation);
    await adapter.commitUndoTransaction(transaction);
  } catch (error) {
    await adapter.rollbackUndoTransaction(transaction);
    throw error;
  }
}

export function allowedParentOrigin(origin, configuredOrigins) {
  return new Set(configuredOrigins).has(origin);
}
