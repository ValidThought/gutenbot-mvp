// ============================================================================
// GutenBot MVP - Type Definitions
// ============================================================================

// --------------------------------------------------------------------------
// User & Profile Types
// --------------------------------------------------------------------------

export const BUNDESLAENDER = [
  { code: 'BW', name: 'Baden-Württemberg', capital: 'Stuttgart' },
  { code: 'BY', name: 'Bayern', capital: 'München' },
  { code: 'BE', name: 'Berlin', capital: 'Berlin' },
  { code: 'BB', name: 'Brandenburg', capital: 'Potsdam' },
  { code: 'HB', name: 'Bremen', capital: 'Bremen' },
  { code: 'HH', name: 'Hamburg', capital: 'Hamburg' },
  { code: 'HE', name: 'Hessen', capital: 'Wiesbaden' },
  { code: 'MV', name: 'Mecklenburg-Vorpommern', capital: 'Schwerin' },
  { code: 'NI', name: 'Niedersachsen', capital: 'Hannover' },
  { code: 'NW', name: 'Nordrhein-Westfalen', capital: 'Düsseldorf' },
  { code: 'RP', name: 'Rheinland-Pfalz', capital: 'Mainz' },
  { code: 'SL', name: 'Saarland', capital: 'Saarbrücken' },
  { code: 'SN', name: 'Sachsen', capital: 'Dresden' },
  { code: 'ST', name: 'Sachsen-Anhalt', capital: 'Magdeburg' },
  { code: 'SH', name: 'Schleswig-Holstein', capital: 'Kiel' },
  { code: 'TH', name: 'Thüringen', capital: 'Erfurt' },
] as const;

export type BundeslandCode = (typeof BUNDESLAENDER)[number]['code'];

export interface Address {
  street: string;
  zip: string;
  city: string;
}

export interface UserProfile {
  id: string;
  name: string;
  address: Address;
  bundesland: BundeslandCode;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// --------------------------------------------------------------------------
// Letter Classification Types
// --------------------------------------------------------------------------

export type LetterCategory =
  | 'BESCHEID'
  | 'MAHNUNG'
  | 'ANHOERUNG'
  | 'ANTRAG_ABLEHNUNG'
  | 'AUFFORDERUNG'
  | 'INFORMATION'
  | 'UNKNOWN';

export type SenderType = 'government' | 'corporate' | 'unknown';

export interface Sender {
  name: string;
  type: SenderType;
  jurisdiction?: string;
  address?: Address;
  aktenzeichen?: string;
}

export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';

export interface Deadline {
  id: string;
  type: string;
  description: string;
  date: Date;
  daysRemaining: number;
  urgency: UrgencyLevel;
  isLegal: boolean; // Gesetzliche Frist vs. behördliche Frist
}

export interface LetterClassification {
  category: LetterCategory;
  confidence: number;
  sender: Sender;
  subject: string;
  receivedDate?: Date;
  documentDate?: Date;
  deadlines: Deadline[];
}

// --------------------------------------------------------------------------
// Letter Analysis Types
// --------------------------------------------------------------------------

export interface LegalReference {
  law: string;
  paragraph: string;
  description: string;
  url?: string;
  isLandesrecht: boolean;
}

export type ActionComplexity = 'simple' | 'moderate' | 'complex';

export interface RecommendedAction {
  id: string;
  title: string;
  description: string;
  deadline?: Date;
  complexity: ActionComplexity;
  templateId?: string;
  risks?: string[];
  requirements?: string[];
}

export type RiskSeverity = 'high' | 'medium' | 'low';

export interface Risk {
  id: string;
  description: string;
  severity: RiskSeverity;
  mitigation: string;
  deadline?: Date;
}

export interface LetterAnalysis {
  summary: string;
  keyPoints: string[];
  legalBasis: LegalReference[];
  recommendedActions: RecommendedAction[];
  risks: Risk[];
  additionalNotes?: string;
}

// --------------------------------------------------------------------------
// Letter Response Types
// --------------------------------------------------------------------------

export type ResponseFormat = 'email' | 'pdf' | 'both';
export type ResponseStatus = 'draft' | 'reviewed' | 'sent' | 'delivered';

export interface LetterResponse {
  id: string;
  letterId: string;
  actionId: string;
  content: string;
  format: ResponseFormat;
  status: ResponseStatus;
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  recipientEmail?: string;
}

// --------------------------------------------------------------------------
// Main Letter Type
// --------------------------------------------------------------------------

export type LetterStatus =
  | 'uploaded'
  | 'processing_ocr'
  | 'ocr_complete'
  | 'processing_analysis'
  | 'analyzed'
  | 'action_selected'
  | 'response_drafted'
  | 'response_reviewed'
  | 'response_sent'
  | 'completed'
  | 'error';

export interface Letter {
  id: string;
  userId: string;
  
  // Source
  imageUrl: string;
  imageData?: string; // Base64 for processing
  
  // OCR Result
  extractedText: string;
  ocrConfidence: number;
  
  // Analysis
  classification: LetterClassification;
  analysis: LetterAnalysis;
  
  // Response
  selectedActionId?: string;
  response?: LetterResponse;
  
  // Metadata
  status: LetterStatus;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// --------------------------------------------------------------------------
// API Types
// --------------------------------------------------------------------------

export interface OCRRequest {
  image: string | File | Blob;
}

export interface OCRResponse {
  text: string;
  confidence: number;
  wordCount: number;
  processingTime: number;
}

export interface AnalysisRequest {
  text: string;
  bundesland: BundeslandCode;
  userId?: string;
}

export interface AnalysisResponse {
  classification: LetterClassification;
  analysis: LetterAnalysis;
}

export interface GenerateRequest {
  letterId: string;
  actionId: string;
  userProfile: UserProfile;
  additionalContext?: string;
}

export interface GenerateResponse {
  content: string;
  templateUsed?: string;
  variables: Record<string, string>;
}

export interface SendRequest {
  letterId: string;
  responseId: string;
  format: ResponseFormat;
  recipientEmail?: string;
}

export interface SendResponse {
  success: boolean;
  pdfUrl?: string;
  emailSent?: boolean;
  error?: string;
}

// --------------------------------------------------------------------------
// Bundesland Legal Context Types
// --------------------------------------------------------------------------

export interface BundeslandLegalContext {
  code: BundeslandCode;
  name: string;
  verwaltungsverfahrensgesetz: string;
  widerspruchsFrist: number; // Days
  zustaendigeGerichte: {
    verwaltungsgericht: string;
    adresse: string;
    website?: string;
  };
  commonAuthorities: Authority[];
  specificLaws: LawReference[];
}

export interface Authority {
  name: string;
  pattern: string[];
  responseTemplate: string;
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
}

export interface LawReference {
  name: string;
  abbreviation: string;
  relevantParagraphs: string[];
  url?: string;
}

// --------------------------------------------------------------------------
// Letter Category Metadata
// --------------------------------------------------------------------------

export interface CategoryMetadata {
  name: string;
  icon: string;
  urgency: UrgencyLevel;
  defaultDeadlines: {
    type: string;
    days: number;
    description: string;
    isLegal: boolean;
  }[];
  commonActions: string[];
  description: string;
}

export const LETTER_CATEGORIES: Record<LetterCategory, CategoryMetadata> = {
  BESCHEID: {
    name: 'Bescheid / Verwaltungsakt',
    icon: '📋',
    urgency: 'high',
    defaultDeadlines: [
      { type: 'widerspruch', days: 30, description: 'Widerspruchsfrist', isLegal: true },
      { type: 'klage', days: 30, description: 'Klagefrist', isLegal: true },
    ],
    commonActions: ['Widerspruch einlegen', 'Fristverlängerung beantragen', 'Klage einreichen', 'Akzeptieren'],
    description: 'Offizieller Bescheid einer Behörde mit Rechtsfolgen',
  },
  MAHNUNG: {
    name: 'Mahnung / Zahlungsaufforderung',
    icon: '💰',
    urgency: 'high',
    defaultDeadlines: [
      { type: 'zahlung', days: 14, description: 'Zahlungsfrist', isLegal: false },
    ],
    commonActions: ['Zahlen', 'Ratenzahlung beantragen', 'Widerspruch einlegen', 'Stundung beantragen'],
    description: 'Zahlungsaufforderung oder Mahnung',
  },
  ANHOERUNG: {
    name: 'Anhörung',
    icon: '👂',
    urgency: 'medium',
    defaultDeadlines: [
      { type: 'stellungnahme', days: 14, description: 'Frist zur Stellungnahme', isLegal: false },
    ],
    commonActions: ['Stellungnahme abgeben', 'Akteneinsicht beantragen', 'Fristverlängerung beantragen'],
    description: 'Möglichkeit zur Stellungnahme vor einer Entscheidung',
  },
  ANTRAG_ABLEHNUNG: {
    name: 'Antragsablehnung',
    icon: '❌',
    urgency: 'high',
    defaultDeadlines: [
      { type: 'widerspruch', days: 30, description: 'Widerspruchsfrist', isLegal: true },
    ],
    commonActions: ['Widerspruch einlegen', 'Neuen Antrag stellen', 'Akzeptieren'],
    description: 'Ablehnung eines gestellten Antrags',
  },
  AUFFORDERUNG: {
    name: 'Aufforderung / Mitwirkungspflicht',
    icon: '📝',
    urgency: 'medium',
    defaultDeadlines: [
      { type: 'mitwirkung', days: 14, description: 'Frist zur Mitwirkung', isLegal: false },
    ],
    commonActions: ['Unterlagen einreichen', 'Fristverlängerung beantragen', 'Rückfragen stellen'],
    description: 'Aufforderung zur Mitwirkung oder Einreichung von Unterlagen',
  },
  INFORMATION: {
    name: 'Information / Mitteilung',
    icon: 'ℹ️',
    urgency: 'low',
    defaultDeadlines: [],
    commonActions: ['Zur Kenntnis nehmen', 'Rückfragen stellen'],
    description: 'Reine Information ohne unmittelbaren Handlungsbedarf',
  },
  UNKNOWN: {
    name: 'Sonstiges',
    icon: '❓',
    urgency: 'low',
    defaultDeadlines: [],
    commonActions: ['Analysieren lassen', 'Experten konsultieren'],
    description: 'Nicht eindeutig klassifizierbares Dokument',
  },
};

// --------------------------------------------------------------------------
// Utility Types
// --------------------------------------------------------------------------

export type AsyncState<T> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
