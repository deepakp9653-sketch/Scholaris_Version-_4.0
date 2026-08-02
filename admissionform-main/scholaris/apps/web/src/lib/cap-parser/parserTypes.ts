// Parser type definitions for CAP Round PDF ingestion

export type Variant = 'GENERAL' | 'EWS' | 'TFWS';
export type ScoreType = 'MHT_CET' | 'JEE_MAIN';
export type Gender = 'M' | 'F' | 'O';

export const SYMBOL_MAP: Record<string, string> = {
  '*': 'BETTERMENT_CHOICE_CODE',
  '@': 'BETTERMENT_SEAT_TYPE',
  '~': 'NO_CHANGE',
  '^': 'ADMITTED_TO_INSTITUTE',
  '&': 'NEWLY_ALLOTTED',
};

export const SYMBOL_LABEL_DISPLAY: Record<string, string> = {
  BETTERMENT_CHOICE_CODE: 'Betterment in Choice Code',
  BETTERMENT_SEAT_TYPE: 'Betterment in Seat Type',
  NO_CHANGE: 'No Change',
  ADMITTED_TO_INSTITUTE: 'Admitted to Institute',
  NEWLY_ALLOTTED: 'Newly Allotted',
};

export interface ParsedCandidate {
  sr_no: number;
  merit_no: number | null;
  score: number | null;
  score_type: ScoreType | null;
  application_id: string | null;
  candidate_name: string;
  gender: Gender | null;
  candidate_category: string | null;
  raw_seat_type: string;
  allotted_seat_type: string;
  status_symbol: string | null;
  status_label: string;
  is_vacant: boolean;
  choice_code: string;
  department_name: string;
  seat_pool_label: string | null;
}

export interface ParsedSeatPool {
  label: string;
  sort_order: number;
  candidates: ParsedCandidate[];
}

export interface ParsedChoiceCode {
  code: string;
  department_name: string;
  variant: Variant;
  status_label: string;
  sanction_intake: number;
  cap_seats: number;
  ms_seats: number;
  minority_seats: number;
  ai_seats: number;
  institute_seats: number;
  filled_seats: number;
  vacant_seats: number;
  seat_pools: ParsedSeatPool[];
}

export interface ParsedBatch {
  institute_code: string;
  institution_code_name: string;
  round_label: string;
  published_on: string | null;
  source_filename: string;
  total_departments: number;
  total_candidate_records: number;
  warnings: string[];
  summary: {
    total_sanction_intake: number;
    total_filled_seats: number;
    total_vacant_seats: number;
  };
  departments: ParsedChoiceCode[];
  records: ParsedCandidate[];
}
