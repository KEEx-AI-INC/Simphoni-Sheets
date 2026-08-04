const A1_RANGE = /^(?:'[^']+'|[A-Za-z0-9_ -]+)?!?\$?[A-Z]{1,3}\$?[1-9][0-9]{0,6}(?::\$?[A-Z]{1,3}\$?[1-9][0-9]{0,6})?$/;
const HEX_COLOR = /^#[A-Fa-f0-9]{6}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const CHART_TYPES = new Set(['bar', 'column', 'line', 'area', 'pie', 'scatter']);
const LEGENDS = new Set(['none', 'top', 'right', 'bottom', 'left']);
const OPERATION_KEYS = {
  setValues: new Set(['kind', 'range', 'values']),
  setFormulas: new Set(['kind', 'range', 'formulas']),
  formatCells: new Set(['kind', 'range', 'format']),
  createOrUpdateChart: new Set(['kind', 'chartId', 'chartType', 'sourceRange', 'anchor', 'size', 'title', 'legend']),
};

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function exactKeys(value, allowed, required, path, errors) {
  for (const key of Object.keys(value)) if (!allowed.has(key)) errors.push(`${path}.${key} is not allowed`);
  for (const key of required) if (!(key in value)) errors.push(`${path}.${key} is required`);
}

function validRange(value) {
  return typeof value === 'string' && value.length <= 256 && A1_RANGE.test(value);
}

function validateMatrix(matrix, path, formulas, errors) {
  if (!Array.isArray(matrix) || matrix.length < 1 || matrix.length > 1000) {
    errors.push(`${path} must contain 1-1000 rows`);
    return;
  }
  const width = Array.isArray(matrix[0]) ? matrix[0].length : 0;
  if (!width || width > 1000) errors.push(`${path} rows must contain 1-1000 columns`);
  matrix.forEach((row, rowIndex) => {
    if (!Array.isArray(row) || row.length !== width) {
      errors.push(`${path}[${rowIndex}] must match the first row width`);
      return;
    }
    row.forEach((cell, columnIndex) => {
      if (formulas && (typeof cell !== 'string' || !cell.startsWith('='))) {
        errors.push(`${path}[${rowIndex}][${columnIndex}] must be a formula beginning with =`);
      } else if (!formulas && !['string', 'number', 'boolean'].includes(typeof cell) && cell !== null) {
        errors.push(`${path}[${rowIndex}][${columnIndex}] has an unsupported value type`);
      }
    });
  });
}

function validateOperation(operation, index, errors) {
  const path = `operations[${index}]`;
  if (!object(operation) || !OPERATION_KEYS[operation.kind]) {
    errors.push(`${path}.kind is not an allowlisted operation`);
    return;
  }
  const allowed = OPERATION_KEYS[operation.kind];
  const required = operation.kind === 'createOrUpdateChart'
    ? ['kind', 'chartId', 'chartType', 'sourceRange', 'anchor', 'size']
    : operation.kind === 'formatCells'
      ? ['kind', 'range', 'format']
      : operation.kind === 'setFormulas'
        ? ['kind', 'range', 'formulas']
        : ['kind', 'range', 'values'];
  exactKeys(operation, allowed, required, path, errors);
  if (operation.kind !== 'createOrUpdateChart' && !validRange(operation.range)) errors.push(`${path}.range is invalid`);
  if (operation.kind === 'setValues') validateMatrix(operation.values, `${path}.values`, false, errors);
  if (operation.kind === 'setFormulas') validateMatrix(operation.formulas, `${path}.formulas`, true, errors);
  if (operation.kind === 'formatCells') {
    if (!object(operation.format) || !Object.keys(operation.format).length) errors.push(`${path}.format must not be empty`);
    const allowedFormat = new Set(['bold', 'italic', 'wrap', 'horizontalAlign', 'numberFormat', 'foregroundColor', 'backgroundColor']);
    if (object(operation.format)) {
      exactKeys(operation.format, allowedFormat, [], `${path}.format`, errors);
      for (const key of ['foregroundColor', 'backgroundColor']) {
        if (operation.format[key] !== undefined && !HEX_COLOR.test(operation.format[key])) errors.push(`${path}.format.${key} is invalid`);
      }
    }
  }
  if (operation.kind === 'createOrUpdateChart') {
    if (!CHART_TYPES.has(operation.chartType)) errors.push(`${path}.chartType is invalid`);
    if (!validRange(operation.sourceRange) || !validRange(operation.anchor)) errors.push(`${path} chart ranges are invalid`);
    if (!object(operation.size) || !Number.isInteger(operation.size.width) || !Number.isInteger(operation.size.height) || operation.size.width < 240 || operation.size.width > 1600 || operation.size.height < 160 || operation.size.height > 1200) errors.push(`${path}.size is invalid`);
    if (operation.legend !== undefined && !LEGENDS.has(operation.legend)) errors.push(`${path}.legend is invalid`);
  }
}

export function validateSheetPatchProposal(value) {
  const errors = [];
  if (!object(value)) return { ok: false, errors: ['proposal must be an object'] };
  exactKeys(value, new Set(['proposalId', 'documentId', 'baseRevision', 'target', 'operations', 'estimatedCredits', 'warnings']), ['proposalId', 'documentId', 'baseRevision', 'target', 'operations', 'estimatedCredits', 'warnings'], 'proposal', errors);
  for (const key of ['proposalId', 'documentId']) if (typeof value[key] !== 'string' || value[key].length < 8 || value[key].length > 128) errors.push(`${key} is invalid`);
  if (typeof value.baseRevision !== 'string' || !value.baseRevision || value.baseRevision.length > 128) errors.push('baseRevision is invalid');
  if (!object(value.target)) errors.push('target is required');
  else {
    exactKeys(value.target, new Set(['sheetId', 'range', 'selectionHash']), ['sheetId', 'range', 'selectionHash'], 'target', errors);
    if (typeof value.target.sheetId !== 'string' || !value.target.sheetId || value.target.sheetId.length > 128) errors.push('target.sheetId is invalid');
    if (!validRange(value.target.range)) errors.push('target.range is invalid');
    if (!SHA256.test(value.target.selectionHash || '')) errors.push('target.selectionHash is invalid');
  }
  if (!Array.isArray(value.operations) || value.operations.length < 1 || value.operations.length > 100) errors.push('operations must contain 1-100 items');
  else value.operations.forEach((operation, index) => validateOperation(operation, index, errors));
  if (typeof value.estimatedCredits !== 'number' || value.estimatedCredits < 0 || value.estimatedCredits > 100000) errors.push('estimatedCredits is invalid');
  if (!Array.isArray(value.warnings) || value.warnings.length > 20 || value.warnings.some((warning) => typeof warning !== 'string' || warning.length > 500)) errors.push('warnings are invalid');
  return { ok: errors.length === 0, errors };
}

export function assertSheetPatchProposal(value) {
  const result = validateSheetPatchProposal(value);
  if (!result.ok) throw new TypeError(`Invalid SheetPatchProposal: ${result.errors.join('; ')}`);
  return value;
}

export const SHEET_OPERATION_KINDS = Object.freeze([...Object.keys(OPERATION_KEYS)]);
