export type SheetPatchTarget = {
  sheetId: string;
  range: string;
  selectionHash: string;
};

export type SetValues = { kind: 'setValues'; range: string; values: unknown[][] };
export type SetFormulas = { kind: 'setFormulas'; range: string; formulas: string[][] };
export type FormatCells = {
  kind: 'formatCells';
  range: string;
  format: {
    bold?: boolean;
    italic?: boolean;
    wrap?: boolean;
    horizontalAlign?: 'left' | 'center' | 'right';
    numberFormat?: string;
    foregroundColor?: string;
    backgroundColor?: string;
  };
};
export type CreateOrUpdateChart = {
  kind: 'createOrUpdateChart';
  chartId: string;
  chartType: 'bar' | 'column' | 'line' | 'area' | 'pie' | 'scatter';
  sourceRange: string;
  anchor: string;
  size: { width: number; height: number };
  title?: string;
  legend?: 'none' | 'top' | 'right' | 'bottom' | 'left';
};
export type SheetOperation = SetValues | SetFormulas | FormatCells | CreateOrUpdateChart;

export type SheetPatchProposal = {
  proposalId: string;
  documentId: string;
  baseRevision: string;
  target: SheetPatchTarget;
  operations: SheetOperation[];
  estimatedCredits: number;
  warnings: string[];
};
