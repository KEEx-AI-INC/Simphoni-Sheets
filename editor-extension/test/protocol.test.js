import assert from 'node:assert/strict';
import { generateKeyPairSync, sign, webcrypto } from 'node:crypto';
import test from 'node:test';

import { applyProposalAtomically, verifyAndValidateApplyEnvelope } from '../src/protocol.js';

if (!globalThis.crypto) globalThis.crypto = webcrypto;

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

function proposal() {
  return {
    proposalId: 'proposal-123', documentId: 'document-123', baseRevision: '7',
    target: { sheetId: 'Sheet1', range: 'A1:B2', selectionHash: 'a'.repeat(64) },
    operations: [{ kind: 'setFormulas', range: 'B2', formulas: [['=SUM(B3:B9)']] }],
    estimatedCredits: 0, warnings: [],
  };
}

test('verifies an Ed25519 apply envelope against the trusted key', async () => {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const unsigned = {
    namespace: 'ai.simphoni.sheets', version: 1, type: 'proposal.apply', approvedByUser: true,
    proposal: proposal(), nonce: 'nonce-123', expiresAt: new Date(Date.now() + 60_000).toISOString(), signingKeyId: 'test-key',
  };
  const envelope = { ...unsigned, signature: sign(null, Buffer.from(canonical(unsigned)), privateKey).toString('base64') };
  const trustedKey = { algorithm: 'Ed25519', format: 'spki-pem', keyId: 'test-key', publicKey: publicKey.export({ type: 'spki', format: 'pem' }).toString() };
  const result = await verifyAndValidateApplyEnvelope(envelope, { documentId: 'document-123', revision: '7', selectionHash: 'a'.repeat(64) }, trustedKey);
  assert.equal(result.proposalId, 'proposal-123');
});

test('applies all operations inside one undoable transaction', async () => {
  const events = [];
  const adapter = {
    async beginUndoTransaction(label) { events.push(['begin', label]); return 'transaction'; },
    async applyOperation(transaction, operation) { events.push(['apply', transaction, operation.kind]); },
    async commitUndoTransaction(transaction) { events.push(['commit', transaction]); },
    async rollbackUndoTransaction(transaction) { events.push(['rollback', transaction]); },
  };
  await applyProposalAtomically(proposal(), adapter);
  assert.deepEqual(events.map((event) => event[0]), ['begin', 'apply', 'commit']);
});
