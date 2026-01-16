# GutenBot MVP - Execution Plan

## Project Overview

**Product**: GutenBot - B2C app for navigating German government/corporate correspondence
**Core Flow**: Scan letter → Classify → Recommend options → Draft response → Send

## Architecture Decision Records

### ADR-001: Platform Choice
- **Decision**: Next.js 14 PWA (App Router)
- **Rationale**: 
  - PWA gives native-like camera access without app store friction
  - Next.js API routes handle backend logic
  - Easy deployment to Vercel/self-hosted
  - React ecosystem for rapid iteration

### ADR-002: OCR Strategy
- **Decision**: Hybrid approach
  - Primary: Tesseract.js (client-side, free)
  - Fallback: Google Cloud Vision API (server-side, paid)
- **Rationale**: Cost control while ensuring quality for difficult scans

### ADR-003: LLM Integration
- **Decision**: Anthropic Claude API (claude-sonnet-4-5-20250929)
- **Rationale**: 
  - Best reasoning for legal/administrative context
  - Good German language support
  - Structured output capabilities

### ADR-004: Landesrecht Data Strategy
- **Decision**: Start with Berlin (BE) + Hessen (HE) only
- **Rationale**: 
  - J has context in both regions (Berlin work, Hessen property)
  - Prove concept before scaling to 16 Länder
  - Manual curation of key Verwaltungsvorschriften initially

### ADR-005: Letter Sending
- **Decision**: Email + PDF download (no postal API yet)
- **Rationale**: MVP simplicity; postal integration is Phase 2

---

## Tech Stack

```
Frontend:        Next.js 14 (App Router) + TypeScript
Styling:         Tailwind CSS + shadcn/ui components
State:           Zustand (lightweight, no boilerplate)
OCR:             Tesseract.js + Google Cloud Vision (fallback)
LLM:             Claude API via Anthropic SDK
Database:        SQLite (local dev) → PostgreSQL (prod)
Auth:            NextAuth.js (email magic link)
File Storage:    Local filesystem (dev) → S3/R2 (prod)
Deployment:      Docker → Hetzner (your existing server)
```

---

## Directory Structure

```
gutenbot/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Landing/home
│   │   ├── onboarding/
│   │   │   └── page.tsx        # Onboarding flow
│   │   ├── scan/
│   │   │   └── page.tsx        # Camera/upload interface
│   │   ├── analysis/
│   │   │   └── [id]/page.tsx   # Letter analysis view
│   │   ├── compose/
│   │   │   └── [id]/page.tsx   # Letter composition
│   │   ├── history/
│   │   │   └── page.tsx        # Past letters
│   │   └── api/
│   │       ├── ocr/route.ts    # OCR processing endpoint
│   │       ├── analyze/route.ts # LLM analysis endpoint
│   │       ├── generate/route.ts # Response generation
│   │       └── send/route.ts   # Email/PDF sending
│   │
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── onboarding/
│   │   │   ├── BundeslandSelector.tsx
│   │   │   ├── UserDataForm.tsx
│   │   │   └── OnboardingProgress.tsx
│   │   ├── scanner/
│   │   │   ├── CameraCapture.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   ├── ImagePreview.tsx
│   │   │   └── OCRProgress.tsx
│   │   ├── analysis/
│   │   │   ├── LetterClassification.tsx
│   │   │   ├── DeadlineAlert.tsx
│   │   │   ├── ActionOptions.tsx
│   │   │   └── LegalContext.tsx
│   │   └── compose/
│   │       ├── LetterEditor.tsx
│   │       ├── TemplateSelector.tsx
│   │       ├── PreviewPane.tsx
│   │       └── SendOptions.tsx
│   │
│   ├── lib/
│   │   ├── ocr/
│   │   │   ├── tesseract.ts    # Tesseract.js wrapper
│   │   │   └── cloudVision.ts  # Google Cloud Vision
│   │   ├── llm/
│   │   │   ├── client.ts       # Claude API client
│   │   │   ├── prompts.ts      # System prompts
│   │   │   └── schemas.ts      # Response schemas (Zod)
│   │   ├── legal/
│   │   │   ├── bundesland.ts   # Landesrecht mapping
│   │   │   ├── deadlines.ts    # Frist calculations
│   │   │   └── categories.ts   # Letter classification
│   │   └── utils/
│   │       ├── pdf.ts          # PDF generation
│   │       ├── email.ts        # Email sending
│   │       └── dates.ts        # German date formatting
│   │
│   ├── data/
│   │   ├── bundeslaender/
│   │   │   ├── BE.json         # Berlin-specific data
│   │   │   └── HE.json         # Hessen-specific data
│   │   ├── templates/
│   │   │   ├── widerspruch.md  # Widerspruch template
│   │   │   ├── fristverlaengerung.md
│   │   │   └── stellungnahme.md
│   │   └── categories.json     # Letter categories
│   │
│   ├── hooks/
│   │   ├── useCamera.ts        # Camera access hook
│   │   ├── useOCR.ts           # OCR processing hook
│   │   ├── useAnalysis.ts      # LLM analysis hook
│   │   └── useUserContext.ts   # User data from store
│   │
│   └── store/
│       ├── userStore.ts        # User profile + Bundesland
│       ├── letterStore.ts      # Current letter state
│       └── historyStore.ts     # Past letters
│
├── public/
│   ├── icons/                  # PWA icons
│   └── manifest.json           # PWA manifest
│
├── prisma/
│   └── schema.prisma           # Database schema
│
├── tests/
│   ├── ocr.test.ts
│   ├── analysis.test.ts
│   └── fixtures/               # Sample letters for testing
│
├── .env.example
├── .env.local
├── docker-compose.yml
├── Dockerfile
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Execution Phases

### Phase 1: Project Setup (Tasks 1.1 - 1.5)

#### Task 1.1: Initialize Next.js Project
```bash
npx create-next-app@latest gutenbot --typescript --tailwind --eslint --app --src-dir
cd gutenbot
```

#### Task 1.2: Install Dependencies
```bash
# Core
npm install zustand @anthropic-ai/sdk tesseract.js

# UI
npm install @radix-ui/react-dialog @radix-ui/react-select class-variance-authority clsx tailwind-merge lucide-react

# Utils
npm install zod date-fns pdf-lib nodemailer

# Dev
npm install -D @types/nodemailer
```

#### Task 1.3: Configure Environment
Create `.env.local`:
```env
# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Google Cloud Vision (optional fallback)
GOOGLE_CLOUD_VISION_KEY=

# Email (for sending)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Task 1.4: Setup shadcn/ui
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input label select textarea dialog alert badge progress
```

#### Task 1.5: Configure PWA
- Add `next-pwa` package
- Create manifest.json
- Add service worker config

---

### Phase 2: Core Data Layer (Tasks 2.1 - 2.4)

#### Task 2.1: Define TypeScript Types
Create `src/types/index.ts`:
```typescript
export interface UserProfile {
  id: string;
  name: string;
  address: {
    street: string;
    zip: string;
    city: string;
  };
  bundesland: BundeslandCode;
  email: string;
  createdAt: Date;
}

export type BundeslandCode = 
  | 'BW' | 'BY' | 'BE' | 'BB' | 'HB' | 'HH' 
  | 'HE' | 'MV' | 'NI' | 'NW' | 'RP' | 'SL' 
  | 'SN' | 'ST' | 'SH' | 'TH';

export interface Letter {
  id: string;
  userId: string;
  imageUrl: string;
  extractedText: string;
  classification: LetterClassification;
  analysis: LetterAnalysis;
  response?: LetterResponse;
  status: LetterStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface LetterClassification {
  category: LetterCategory;
  confidence: number;
  sender: {
    name: string;
    type: 'government' | 'corporate' | 'unknown';
    jurisdiction?: string;
  };
  subject: string;
  receivedDate?: Date;
  deadlines: Deadline[];
}

export interface Deadline {
  type: string;
  description: string;
  date: Date;
  daysRemaining: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

export type LetterCategory = 
  | 'BESCHEID'
  | 'MAHNUNG' 
  | 'ANHOERUNG'
  | 'ANTRAG_ABLEHNUNG'
  | 'AUFFORDERUNG'
  | 'INFORMATION'
  | 'UNKNOWN';

export interface LetterAnalysis {
  summary: string;
  keyPoints: string[];
  legalBasis: LegalReference[];
  recommendedActions: RecommendedAction[];
  risks: Risk[];
}

export interface RecommendedAction {
  id: string;
  title: string;
  description: string;
  deadline?: Date;
  complexity: 'simple' | 'moderate' | 'complex';
  templateId?: string;
}

export interface LegalReference {
  law: string;
  paragraph: string;
  description: string;
  url?: string;
}

export interface Risk {
  description: string;
  severity: 'high' | 'medium' | 'low';
  mitigation: string;
}

export interface LetterResponse {
  id: string;
  letterId: string;
  actionId: string;
  content: string;
  format: 'email' | 'pdf' | 'both';
  status: 'draft' | 'reviewed' | 'sent';
  sentAt?: Date;
}

export type LetterStatus = 
  | 'uploaded'
  | 'processing'
  | 'analyzed'
  | 'action_selected'
  | 'response_drafted'
  | 'response_sent'
  | 'completed';
```

#### Task 2.2: Create Zustand Stores
Create `src/store/userStore.ts`:
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, BundeslandCode } from '@/types';

interface UserState {
  profile: UserProfile | null;
  isOnboarded: boolean;
  setProfile: (profile: UserProfile) => void;
  updateBundesland: (code: BundeslandCode) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: null,
      isOnboarded: false,
      setProfile: (profile) => set({ profile, isOnboarded: true }),
      updateBundesland: (code) => 
        set((state) => ({
          profile: state.profile 
            ? { ...state.profile, bundesland: code }
            : null
        })),
      reset: () => set({ profile: null, isOnboarded: false }),
    }),
    { name: 'gutenbot-user' }
  )
);
```

#### Task 2.3: Create Bundesland Data Files
Create `src/data/bundeslaender/BE.json` and `HE.json` with:
- Key Verwaltungsvorschriften
- Relevant Landesrecht references
- Local authority contact patterns
- Specific deadlines/procedures

#### Task 2.4: Create Letter Templates
Create markdown templates in `src/data/templates/` for:
- Widerspruch (generic + category-specific)
- Fristverlängerung
- Stellungnahme
- Akteneinsicht
- Ratenzahlung

---

### Phase 3: OCR Module (Tasks 3.1 - 3.4)

#### Task 3.1: Implement Tesseract.js Wrapper
Create `src/lib/ocr/tesseract.ts`:
```typescript
import { createWorker } from 'tesseract.js';

export async function extractTextWithTesseract(
  imageData: string | File
): Promise<{ text: string; confidence: number }> {
  const worker = await createWorker('deu'); // German language
  
  try {
    const { data } = await worker.recognize(imageData);
    return {
      text: data.text,
      confidence: data.confidence,
    };
  } finally {
    await worker.terminate();
  }
}
```

#### Task 3.2: Implement Cloud Vision Fallback
Create `src/lib/ocr/cloudVision.ts` for cases where Tesseract confidence is low.

#### Task 3.3: Create Camera Capture Component
Create `src/components/scanner/CameraCapture.tsx`:
- Request camera permissions
- Live preview
- Capture button
- Image quality checks
- Auto-crop detection (nice-to-have)

#### Task 3.4: Create OCR API Route
Create `src/app/api/ocr/route.ts`:
- Accept image upload
- Try Tesseract first
- Fall back to Cloud Vision if confidence < 70%
- Return extracted text + metadata

---

### Phase 4: LLM Analysis Module (Tasks 4.1 - 4.5)

#### Task 4.1: Create Claude API Client
Create `src/lib/llm/client.ts`:
```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function analyzeWithClaude<T>(
  systemPrompt: string,
  userMessage: string,
  schema: z.ZodSchema<T>
): Promise<T> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });
  
  // Parse and validate response
  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');
  
  return schema.parse(JSON.parse(content.text));
}
```

#### Task 4.2: Design Analysis Prompts
Create `src/lib/llm/prompts.ts`:
```typescript
export const CLASSIFICATION_PROMPT = `
Du bist ein Experte für deutsche Verwaltungskorrespondenz. 
Analysiere den folgenden Brief und extrahiere strukturierte Informationen.

KONTEXT:
- Bundesland des Empfängers: {{bundesland}}
- Relevantes Landesrecht: {{landesrecht}}

AUFGABEN:
1. Klassifiziere den Brieftyp
2. Identifiziere Absender und Betreff
3. Erkenne alle Fristen (Widerspruchsfrist, Zahlungsfrist, etc.)
4. Liste die rechtlichen Grundlagen
5. Empfehle Handlungsoptionen

ANTWORTE NUR MIT VALIDEM JSON im folgenden Format:
{
  "category": "BESCHEID" | "MAHNUNG" | "ANHOERUNG" | ...,
  "confidence": 0.0-1.0,
  "sender": { "name": "...", "type": "government|corporate|unknown" },
  "subject": "...",
  "deadlines": [{ "type": "...", "date": "YYYY-MM-DD", "description": "..." }],
  "legalBasis": [{ "law": "...", "paragraph": "...", "description": "..." }],
  "summary": "...",
  "keyPoints": ["...", "..."],
  "recommendedActions": [{ "id": "...", "title": "...", "description": "..." }]
}
`;

export const RESPONSE_GENERATION_PROMPT = `
Du bist ein Experte für formelle deutsche Korrespondenz.
Erstelle einen {{actionType}} basierend auf dem analysierten Brief.

ABSENDER:
Name: {{userName}}
Adresse: {{userAddress}}
Bundesland: {{bundesland}}

EMPFÄNGER:
{{senderInfo}}

URSPRUNGSBRIEF:
{{originalLetterSummary}}

GEWÄHLTE AKTION:
{{selectedAction}}

RECHTLICHER KONTEXT:
{{legalContext}}

Erstelle einen formell korrekten, höflichen aber bestimmten Brief.
Verwende die korrekte Anrede und Grußformel.
Beziehe dich auf relevante Aktenzeichen und Fristen.
`;
```

#### Task 4.3: Create Zod Schemas for Validation
Create `src/lib/llm/schemas.ts` with strict validation for LLM outputs.

#### Task 4.4: Create Analysis API Route
Create `src/app/api/analyze/route.ts`:
- Accept OCR text + user context
- Load Bundesland-specific legal data
- Call Claude for analysis
- Validate and return structured result

#### Task 4.5: Create Response Generation API Route
Create `src/app/api/generate/route.ts`:
- Accept selected action + letter context
- Generate appropriate response draft
- Return editable markdown

---

### Phase 5: UI Implementation (Tasks 5.1 - 5.6)

#### Task 5.1: Create Root Layout
`src/app/layout.tsx`:
- PWA meta tags
- Font loading (German-friendly typography)
- Theme provider
- Toast notifications

#### Task 5.2: Implement Onboarding Flow
`src/app/onboarding/page.tsx`:
- Step 1: Bundesland selection (map or dropdown)
- Step 2: Personal data (name, address)
- Step 3: Email for sending
- Progress indicator
- Skip option (limited functionality)

#### Task 5.3: Implement Scanner Page
`src/app/scan/page.tsx`:
- Camera capture OR file upload
- Image preview with crop/rotate
- OCR progress indicator
- Error handling for poor quality images
- "Analyze" CTA

#### Task 5.4: Implement Analysis Page
`src/app/analysis/[id]/page.tsx`:
- Letter classification badge
- Deadline alerts (with countdown)
- Summary and key points
- Legal references (collapsible)
- Action cards (selectable)
- "Continue with [Action]" CTA

#### Task 5.5: Implement Compose Page
`src/app/compose/[id]/page.tsx`:
- Rich text editor (or markdown)
- Template insertion
- Side-by-side preview
- Variable replacement helpers
- Save draft / Edit / Send buttons

#### Task 5.6: Implement History Page
`src/app/history/page.tsx`:
- List of past letters
- Filter by status/category
- Quick actions (resend, copy)

---

### Phase 6: Sending & Export (Tasks 6.1 - 6.3)

#### Task 6.1: PDF Generation
Create `src/lib/utils/pdf.ts`:
- Use pdf-lib for generation
- Proper German letter format (DIN 5008)
- Include user letterhead
- Proper margins and typography

#### Task 6.2: Email Sending
Create `src/lib/utils/email.ts`:
- Nodemailer integration
- HTML + plain text versions
- Attachment support (PDF)
- Delivery confirmation

#### Task 6.3: Create Send API Route
`src/app/api/send/route.ts`:
- Accept response + delivery method
- Generate PDF if needed
- Send email
- Update letter status
- Return confirmation

---

### Phase 7: Testing & Polish (Tasks 7.1 - 7.4)

#### Task 7.1: Create Test Fixtures
Add sample letters in `tests/fixtures/`:
- Bescheid vom Finanzamt
- Mahnung Rundfunkbeitrag
- Anhörung Bußgeldverfahren
- Ablehnungsbescheid Wohngeld

#### Task 7.2: OCR Accuracy Testing
Test Tesseract vs Cloud Vision on fixture images.

#### Task 7.3: LLM Output Validation
Ensure Claude responses match Zod schemas consistently.

#### Task 7.4: E2E Flow Testing
Full flow from scan → analyze → compose → send.

---

### Phase 8: Deployment (Tasks 8.1 - 8.3)

#### Task 8.1: Docker Configuration
Create `Dockerfile` and `docker-compose.yml` for Hetzner deployment.

#### Task 8.2: Environment Setup
- Configure Traefik/nginx reverse proxy
- Set up SSL (Let's Encrypt)
- Configure environment variables

#### Task 8.3: CI/CD Pipeline
- GitHub Actions for testing
- Auto-deploy on main branch push

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| OCR quality on poor scans | High | Cloud Vision fallback, manual correction UI |
| LLM hallucination on legal advice | Critical | Validation schemas, disclaimers, source links |
| Landesrecht data outdated | High | Regular manual review, community contributions |
| GDPR compliance | Critical | Local storage, encryption, deletion capability |
| Frist miscalculation | Critical | Conservative defaults, explicit warnings |

---

## Success Metrics (MVP)

- [ ] Complete flow works for 1 sample letter
- [ ] OCR extracts >90% of text accurately
- [ ] LLM correctly classifies letter category
- [ ] Generated response is legally sound
- [ ] PDF export matches DIN 5008
- [ ] Email sending works reliably

---

## Future Iterations (Post-MVP)

1. **Corporate letters** - Add insurance, telecom, utility patterns
2. **All 16 Bundesländer** - Complete Landesrecht coverage
3. **Postal sending** - Integration with letter API (e.g., Pingen)
4. **Document storage** - Secure archive with search
5. **Reminder system** - Push notifications for deadlines
6. **Expert escalation** - Connect to lawyers/advisors
7. **Multi-language** - Support for non-German speakers

---

## Agent Execution Notes

When executing this plan in a local agent environment:

1. **Execute sequentially** - Complete each phase before moving to next
2. **Test incrementally** - Verify each component works before integration
3. **Commit often** - Git commit after each task completion
4. **Document decisions** - Note any deviations from plan
5. **Ask for clarification** - If a task is ambiguous, pause and ask

### Quick Start Commands

```bash
# Clone and setup
git clone <repo> && cd gutenbot
npm install

# Start development
npm run dev

# Test specific component
npm run test -- --grep "OCR"

# Build for production
npm run build

# Deploy
docker-compose up -d
```
