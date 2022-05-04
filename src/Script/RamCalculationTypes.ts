export enum RamCalculationErrorCode {
  SyntaxError = -1,
  ImportError = -2,
  URLImportError = -3,
}

export interface RamUsageEntry {
  type: "ns" | "dom" | "fn" | "misc";
  name: string;
  cost: number;
}

export interface RamCalculation {
  cost: number;
  entries?: RamUsageEntry[];
}
