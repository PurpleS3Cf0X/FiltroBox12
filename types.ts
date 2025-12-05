
export enum SensitivityLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum PiiType {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  CREDIT_CARD = 'CREDIT_CARD',
  SSN = 'SSN',
  API_KEY = 'API_KEY',
  NAME = 'NAME',
  LOCATION = 'LOCATION',
  IP_ADDRESS = 'IP_ADDRESS',
  CUSTOM = 'CUSTOM',
}

export interface PiiEntity {
  id: string;
  text: string;
  type: PiiType;
  level: SensitivityLevel;
  start: number; // Placeholder for future index-based highlighting
  end: number;   // Placeholder for future index-based highlighting
  replacement: string;
}

export interface AnalysisResult {
  originalText: string;
  sanitizedText: string;
  entities: PiiEntity[];
  riskScore: number;
  processingTime: number;
  summary: string;
  classification: string;
}

export interface Rule {
  id: string;
  name: string;
  type: PiiType;
  enabled: boolean;
  description: string;
  pattern?: string; // Regex string if applicable
  level: SensitivityLevel;
}

export type ViewState = 'LANDING' | 'ANALYSIS' | 'RULES' | 'DASHBOARD' | 'SETTINGS';
