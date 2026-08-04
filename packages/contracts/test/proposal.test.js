import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSheetPatchProposal } from '../src/index.js';

const base = {
  proposalId: 'proposal-123',
  documentId: 'document-123',
  baseRevision: '7',
  target: { sheetId: 'Sheet1', range: 'A1:B2', selectionHash: 'a'.repeat(64) },
  estimatedCredits: 2,
  warnings: [],
};

test('accepts values, formulas, formatting, and allowlisted charts', () => {
  const result = validateSheetPatchProposal({
    ...base,
    operations: [
      { kind: 'setValues', range: 'A1:B1', values: [['Month', 'Revenue']] },
      { kind: 'setFormulas', range: 'B2', formulas: [['=SUM(B3:B12)']] },
      { kind: 'formatCells', range: 'A1:B1', format: { bold: true, backgroundColor: '#9FFFD7' } },
      { kind: 'createOrUpdateChart', chartId: 'revenue', chartType: 'column', sourceRange: 'A1:B12', anchor: 'D2', size: { width: 640, height: 360 }, legend: 'bottom' },
    ],
  });
  assert.equal(result.ok, true, result.errors.join('\n'));
});

test('rejects arbitrary execution and unknown fields', () => {
  const result = validateSheetPatchProposal({ ...base, operations: [{ kind: 'python', code: 'import os' }] });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /allowlisted/);
});

test('rejects chart types and selection hashes outside the contract', () => {
  const result = validateSheetPatchProposal({
    ...base,
    target: { ...base.target, selectionHash: 'not-a-hash' },
    operations: [{ kind: 'createOrUpdateChart', chartId: 'x', chartType: '3d', sourceRange: 'A1:B2', anchor: 'D1', size: { width: 10, height: 10 } }],
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /selectionHash/);
  assert.match(result.errors.join(' '), /chartType/);
});
