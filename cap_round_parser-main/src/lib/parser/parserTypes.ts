export type Variant = 'GENERAL' | 'EWS' | 'TFWS';
export type ScoreType = 'MHT_CET' | 'JEE_MAIN';
export type Gender = 'M' | 'F' | 'O';

export interface ParsedCandidate {
  srNo: number;
  meritNo: number | null;
  score: number | null;
  scoreType: ScoreType | null;
  applicationId: string | null;
  candidateName: string;
  gender: Gender | null;
  category: string | null;
  seatTypeCode: string;
  statusSymbol: string | null;
  statusLabel: string | null;
  isVacant: boolean;
}

export interface ParsedSeatPool {
  label: string;
  sortOrder: number;
  candidates: ParsedCandidate[];
}

export interface ParsedChoiceCode {
  code: string;
  departmentName: string;
  variant: Variant;
  statusLabel: string;
  sanctionIntake: number;
  capSeats: number;
  msSeats: number;
  minoritySeats: number;
  aiSeats: number;
  instituteSeats: number;
  filledSeats: number;
  vacantSeats: number;
  seatPools: ParsedSeatPool[];
  candidates: ParsedCandidate[];
  reconciled: boolean;
  reconciliationWarning?: string;
}

export interface ParsedBatch {
  instituteCode: string;
  instituteName: string;
  roundLabel: string;
  publishedOnDate: string | null;
  sourceFilename: string;
  totalChoiceCodes: number;
  totalCandidates: number;
  totalFilledSeats: number;
  totalVacantSeats: number;
  choiceCodes: ParsedChoiceCode[];
  warnings: string[];
}

export const SYMBOL_MAP: Record<string, string> = {
  '*': 'BETTERMENT_CHOICE_CODE',
  '@': 'BETTERMENT_SEAT_TYPE',
  '~': 'NO_CHANGE',
  '^': 'ADMITTED_TO_INSTITUTE',
  '&': 'NEWLY_ALLOTTED'
};

export const SYMBOL_LABEL_DISPLAY: Record<string, string> = {
  '*': 'Betterment in Choice Code',
  '@': 'Betterment in Seat Type',
  '~': 'No Change',
  '^': 'Admitted to Institute',
  '&': 'Newly Allotted'
};
