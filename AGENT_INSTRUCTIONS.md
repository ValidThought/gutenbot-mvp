# GutenBot - Agent Execution Instructions

## How to Use This File

Feed this file to your local coding agent (Claude Code, Cursor, Aider, etc.) along with the PLAN.md for context. Execute tasks sequentially. Each task has:
- **Objective**: What to achieve
- **Files**: Which files to create/modify
- **Acceptance Criteria**: How to verify completion

---

## Phase 1: Project Setup

### Task 1.1: Initialize Project

**Objective**: Create Next.js 14 project with TypeScript and Tailwind

**Commands**:
```bash
cd /home/claude
npx create-next-app@latest gutenbot --typescript --tailwind --eslint --app --src-dir --no-git
cd gutenbot
git init
```

**Acceptance Criteria**:
- [ ] `npm run dev` starts without errors
- [ ] http://localhost:3000 shows Next.js welcome page

---

### Task 1.2: Install Dependencies

**Objective**: Add all required packages

**Commands**:
```bash
# Core functionality
npm install zustand @anthropic-ai/sdk tesseract.js zod date-fns

# PDF and email
npm install pdf-lib nodemailer
npm install -D @types/nodemailer

# UI components (will setup shadcn next)
npm install clsx tailwind-merge lucide-react

# PWA support
npm install next-pwa
```

**Acceptance Criteria**:
- [ ] `npm ls` shows all packages installed
- [ ] No peer dependency warnings

---

### Task 1.3: Setup shadcn/ui

**Objective**: Initialize shadcn/ui and add required components

**Commands**:
```bash
npx shadcn@latest init -d
npx shadcn@latest add button card input label select textarea dialog alert badge progress tabs separator
```

**Acceptance Criteria**:
- [ ] `src/components/ui/` directory exists with components
- [ ] `components.json` exists in root

---

### Task 1.4: Create Environment Configuration

**Objective**: Setup environment variables

**Create `.env.example`**:
```env
# Anthropic API (required)
ANTHROPIC_API_KEY=sk-ant-api03-xxx

# Google Cloud Vision (optional fallback)
GOOGLE_APPLICATION_CREDENTIALS=
GOOGLE_CLOUD_PROJECT=

# Email sending (required for send feature)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@gutenbot.de

# App configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=GutenBot
```

**Create `.env.local`** (copy from .env.example and fill in real values)

**Acceptance Criteria**:
- [ ] `.env.example` exists
- [ ] `.env.local` exists (gitignored)
- [ ] `.gitignore` includes `.env.local`

---

### Task 1.5: Configure PWA

**Objective**: Make app installable as PWA with camera access

**Modify `next.config.js`**:
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your existing config
};

module.exports = withPWA(nextConfig);
```

**Create `public/manifest.json`**:
```json
{
  "name": "GutenBot",
  "short_name": "GutenBot",
  "description": "Dein Assistent für Behördenbriefe",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1a1a2e",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Update `src/app/layout.tsx`** to include manifest link.

**Acceptance Criteria**:
- [ ] Manifest loads at `/manifest.json`
- [ ] PWA install prompt appears (in production build)

---

## Phase 2: Core Data Layer

### Task 2.1: Create TypeScript Types

**Objective**: Define all type definitions for the application

**Create `src/types/index.ts`**:

Full type definitions as specified in PLAN.md including:
- `UserProfile`
- `BundeslandCode`
- `Letter`
- `LetterClassification`
- `LetterAnalysis`
- `RecommendedAction`
- `LegalReference`
- `Risk`
- `LetterResponse`
- `LetterStatus`
- `Deadline`

**Acceptance Criteria**:
- [ ] No TypeScript errors in types file
- [ ] Can import types in other files

---

### Task 2.2: Create Zustand Stores

**Objective**: Setup state management for user, letters, and history

**Create `src/store/userStore.ts`**:
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, BundeslandCode } from '@/types';

interface UserState {
  profile: UserProfile | null;
  isOnboarded: boolean;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateBundesland: (code: BundeslandCode) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: null,
      isOnboarded: false,
      setProfile: (profile) => set({ profile, isOnboarded: true }),
      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updates } : null,
        })),
      updateBundesland: (code) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, bundesland: code } : null,
        })),
      reset: () => set({ profile: null, isOnboarded: false }),
    }),
    { name: 'gutenbot-user' }
  )
);
```

**Create `src/store/letterStore.ts`**:
```typescript
import { create } from 'zustand';
import type { Letter, LetterStatus } from '@/types';

interface LetterState {
  currentLetter: Letter | null;
  isProcessing: boolean;
  error: string | null;
  setCurrentLetter: (letter: Letter) => void;
  updateStatus: (status: LetterStatus) => void;
  setProcessing: (processing: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useLetterStore = create<LetterState>((set) => ({
  currentLetter: null,
  isProcessing: false,
  error: null,
  setCurrentLetter: (letter) => set({ currentLetter: letter, error: null }),
  updateStatus: (status) =>
    set((state) => ({
      currentLetter: state.currentLetter
        ? { ...state.currentLetter, status }
        : null,
    })),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setError: (error) => set({ error, isProcessing: false }),
  reset: () => set({ currentLetter: null, isProcessing: false, error: null }),
}));
```

**Create `src/store/historyStore.ts`** for past letters with persistence.

**Acceptance Criteria**:
- [ ] Stores persist across page refresh
- [ ] Can update and read state from components

---

### Task 2.3: Create Bundesland Data

**Objective**: Add legal context data for Berlin and Hessen

**Create `src/data/bundeslaender/index.ts`**:
```typescript
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

export type BundeslandCode = typeof BUNDESLAENDER[number]['code'];
```

**Create `src/data/bundeslaender/BE.json`**:
```json
{
  "code": "BE",
  "name": "Berlin",
  "legalContext": {
    "verwaltungsverfahrensgesetz": "VwVfG Berlin",
    "widerspruchsFrist": 30,
    "zustaendigeGerichte": {
      "verwaltungsgericht": "Verwaltungsgericht Berlin",
      "adresse": "Kirchstraße 7, 10557 Berlin"
    }
  },
  "commonAuthorities": [
    {
      "name": "Finanzamt",
      "pattern": ["finanzamt", "steuerbescheid", "einkommensteuer"],
      "responseTemplate": "finanzamt"
    },
    {
      "name": "Bürgeramt",
      "pattern": ["bürgeramt", "meldebescheinigung", "personalausweis"],
      "responseTemplate": "buergeramt"
    },
    {
      "name": "Jobcenter",
      "pattern": ["jobcenter", "arbeitslosengeld", "bürgergeld"],
      "responseTemplate": "jobcenter"
    }
  ],
  "specificLaws": [
    {
      "name": "Berliner Verwaltungsverfahrensgesetz",
      "abbreviation": "VwVfG Bln",
      "relevantParagraphs": ["§ 35", "§ 37", "§ 39", "§ 70"]
    }
  ]
}
```

**Create `src/data/bundeslaender/HE.json`** with Hessen-specific data.

**Acceptance Criteria**:
- [ ] JSON files are valid and importable
- [ ] TypeScript can infer types from data

---

### Task 2.4: Create Letter Templates

**Objective**: Add response templates for common actions

**Create `src/data/templates/widerspruch.md`**:
```markdown
{{absender_name}}
{{absender_strasse}}
{{absender_plz}} {{absender_ort}}

{{empfaenger_name}}
{{empfaenger_adresse}}

{{datum}}

**Widerspruch gegen {{bescheid_typ}} vom {{bescheid_datum}}**
Aktenzeichen: {{aktenzeichen}}

Sehr geehrte Damen und Herren,

hiermit lege ich gegen den oben genannten Bescheid vom {{bescheid_datum}}, mir zugestellt am {{zustellung_datum}}, fristgerecht 

**Widerspruch**

ein.

**Begründung:**

{{begruendung}}

Ich bitte um Überprüfung des Bescheids und um einen rechtsmittelfähigen Widerspruchsbescheid.

Mit freundlichen Grüßen

{{absender_name}}
```

**Create additional templates**:
- `fristverlaengerung.md`
- `stellungnahme.md`
- `ratenzahlung.md`
- `akteneinsicht.md`

**Acceptance Criteria**:
- [ ] All templates have consistent variable syntax
- [ ] Templates follow DIN 5008 letter format

---

## Phase 3: OCR Module

### Task 3.1: Implement Tesseract Wrapper

**Create `src/lib/ocr/tesseract.ts`**:
```typescript
import { createWorker, Worker } from 'tesseract.js';

let worker: Worker | null = null;

export async function initializeWorker(): Promise<Worker> {
  if (worker) return worker;
  
  worker = await createWorker('deu', 1, {
    logger: (m) => console.log('[Tesseract]', m),
  });
  
  return worker;
}

export async function extractText(
  image: string | File | Blob
): Promise<{
  text: string;
  confidence: number;
  words: Array<{ text: string; confidence: number }>;
}> {
  const w = await initializeWorker();
  const { data } = await w.recognize(image);
  
  return {
    text: data.text,
    confidence: data.confidence,
    words: data.words.map((word) => ({
      text: word.text,
      confidence: word.confidence,
    })),
  };
}

export async function terminateWorker(): Promise<void> {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}
```

**Acceptance Criteria**:
- [ ] Can extract text from test image
- [ ] Returns confidence score

---

### Task 3.2: Create Camera Hook

**Create `src/hooks/useCamera.ts`**:
```typescript
import { useState, useRef, useCallback, useEffect } from 'react';

interface UseCameraOptions {
  facingMode?: 'user' | 'environment';
}

export function useCamera(options: UseCameraOptions = {}) {
  const { facingMode = 'environment' } = options;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        setIsReady(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Camera access denied');
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsReady(false);
    }
  }, [stream]);

  const capture = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.9);
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return {
    videoRef,
    canvasRef,
    stream,
    error,
    isReady,
    startCamera,
    stopCamera,
    capture,
  };
}
```

**Acceptance Criteria**:
- [ ] Camera starts on mobile and desktop
- [ ] Captures image as base64

---

### Task 3.3: Create OCR API Route

**Create `src/app/api/ocr/route.ts`**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { extractText } from '@/lib/ocr/tesseract';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as Blob;
    
    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    const result = await extractText(image);
    
    // If confidence is too low, could trigger Cloud Vision fallback here
    if (result.confidence < 70) {
      console.warn('Low OCR confidence:', result.confidence);
      // TODO: Cloud Vision fallback
    }

    return NextResponse.json({
      text: result.text,
      confidence: result.confidence,
      wordCount: result.words.length,
    });
  } catch (error) {
    console.error('OCR error:', error);
    return NextResponse.json(
      { error: 'OCR processing failed' },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria**:
- [ ] Endpoint accepts image upload
- [ ] Returns extracted text with confidence

---

## Phase 4: LLM Analysis Module

### Task 4.1: Create Claude Client

**Create `src/lib/llm/client.ts`**:
```typescript
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function complete(
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number }
): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: options?.maxTokens ?? 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }
  return content.text;
}

export async function completeWithSchema<T>(
  systemPrompt: string,
  userMessage: string,
  schema: z.ZodSchema<T>
): Promise<T> {
  const text = await complete(systemPrompt, userMessage);
  
  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || 
                    text.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }
  
  const json = jsonMatch[1] || jsonMatch[0];
  const parsed = JSON.parse(json);
  return schema.parse(parsed);
}
```

**Acceptance Criteria**:
- [ ] Can make API calls to Claude
- [ ] Parses JSON responses correctly

---

### Task 4.2: Create Analysis Prompts

**Create `src/lib/llm/prompts.ts`** with:
- `CLASSIFICATION_SYSTEM_PROMPT`
- `ANALYSIS_SYSTEM_PROMPT`
- `RESPONSE_GENERATION_PROMPT`

Include Bundesland-specific context injection.

---

### Task 4.3: Create Validation Schemas

**Create `src/lib/llm/schemas.ts`**:
```typescript
import { z } from 'zod';

export const DeadlineSchema = z.object({
  type: z.string(),
  description: z.string(),
  date: z.string().transform((s) => new Date(s)),
  daysRemaining: z.number(),
  urgency: z.enum(['critical', 'high', 'medium', 'low']),
});

export const LegalReferenceSchema = z.object({
  law: z.string(),
  paragraph: z.string(),
  description: z.string(),
  url: z.string().optional(),
});

export const RecommendedActionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  deadline: z.string().transform((s) => new Date(s)).optional(),
  complexity: z.enum(['simple', 'moderate', 'complex']),
  templateId: z.string().optional(),
});

export const ClassificationSchema = z.object({
  category: z.enum([
    'BESCHEID',
    'MAHNUNG',
    'ANHOERUNG',
    'ANTRAG_ABLEHNUNG',
    'AUFFORDERUNG',
    'INFORMATION',
    'UNKNOWN',
  ]),
  confidence: z.number().min(0).max(1),
  sender: z.object({
    name: z.string(),
    type: z.enum(['government', 'corporate', 'unknown']),
    jurisdiction: z.string().optional(),
  }),
  subject: z.string(),
  receivedDate: z.string().transform((s) => new Date(s)).optional(),
  deadlines: z.array(DeadlineSchema),
});

export const AnalysisSchema = z.object({
  classification: ClassificationSchema,
  summary: z.string(),
  keyPoints: z.array(z.string()),
  legalBasis: z.array(LegalReferenceSchema),
  recommendedActions: z.array(RecommendedActionSchema),
  risks: z.array(z.object({
    description: z.string(),
    severity: z.enum(['high', 'medium', 'low']),
    mitigation: z.string(),
  })),
});

export type Analysis = z.infer<typeof AnalysisSchema>;
```

**Acceptance Criteria**:
- [ ] Schemas validate correctly
- [ ] Types are properly inferred

---

### Task 4.4: Create Analysis API Route

**Create `src/app/api/analyze/route.ts`**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { completeWithSchema } from '@/lib/llm/client';
import { AnalysisSchema } from '@/lib/llm/schemas';
import { ANALYSIS_SYSTEM_PROMPT } from '@/lib/llm/prompts';
import BerlinData from '@/data/bundeslaender/BE.json';
import HessenData from '@/data/bundeslaender/HE.json';

const bundeslandData: Record<string, any> = {
  BE: BerlinData,
  HE: HessenData,
};

export async function POST(request: NextRequest) {
  try {
    const { text, bundesland } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    const legalContext = bundeslandData[bundesland] || {};
    
    const systemPrompt = ANALYSIS_SYSTEM_PROMPT
      .replace('{{bundesland}}', bundesland)
      .replace('{{legalContext}}', JSON.stringify(legalContext));

    const analysis = await completeWithSchema(
      systemPrompt,
      `Analysiere folgenden Brief:\n\n${text}`,
      AnalysisSchema
    );

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria**:
- [ ] Returns structured analysis
- [ ] Includes Bundesland-specific context

---

## Phase 5: UI Implementation

### Task 5.1: Create App Layout

**Update `src/app/layout.tsx`** with:
- German-friendly fonts
- PWA meta tags
- Theme colors
- Navigation structure

---

### Task 5.2: Create Onboarding Page

**Create `src/app/onboarding/page.tsx`**:
- Multi-step form (Bundesland → Personal Data → Confirmation)
- Progress indicator
- Validation
- Redirect to /scan on completion

---

### Task 5.3: Create Scanner Page

**Create `src/app/scan/page.tsx`**:
- Camera view with capture button
- File upload alternative
- Image preview with retry option
- OCR progress indicator
- Redirect to /analysis/[id] on completion

---

### Task 5.4: Create Analysis Page

**Create `src/app/analysis/[id]/page.tsx`**:
- Classification badge with confidence
- Deadline alerts (sorted by urgency)
- Summary and key points
- Legal references (expandable)
- Action cards (selectable)
- Continue button → /compose/[id]

---

### Task 5.5: Create Compose Page

**Create `src/app/compose/[id]/page.tsx`**:
- Letter editor (textarea or rich text)
- Template preview
- Variable replacement UI
- PDF preview (side panel)
- Send/Download buttons

---

### Task 5.6: Create History Page

**Create `src/app/history/page.tsx`**:
- List of past letters
- Status badges
- Quick view/resend actions

---

## Phase 6: Sending & Export

### Task 6.1: Create PDF Generator

**Create `src/lib/utils/pdf.ts`**:
- DIN 5008 letter format
- User letterhead
- Proper margins (left: 25mm, right: 20mm)
- Date and reference line formatting

---

### Task 6.2: Create Email Service

**Create `src/lib/utils/email.ts`**:
- Nodemailer configuration
- HTML and plain text templates
- PDF attachment support

---

### Task 6.3: Create Send API Route

**Create `src/app/api/send/route.ts`**:
- Accept letter content + method
- Generate PDF
- Send email with attachment
- Return confirmation

---

## Verification Checklist

After completing all tasks, verify:

- [ ] Fresh user can complete onboarding
- [ ] Camera capture works on mobile
- [ ] File upload works as alternative
- [ ] OCR extracts German text accurately
- [ ] Analysis returns structured data
- [ ] Deadlines are calculated correctly
- [ ] Response drafts are legally appropriate
- [ ] PDF export matches DIN 5008
- [ ] Email sending works
- [ ] History persists across sessions

---

## Deployment Commands

```bash
# Build production bundle
npm run build

# Test production build locally
npm run start

# Docker build
docker build -t gutenbot:latest .

# Deploy to Hetzner
docker-compose -f docker-compose.prod.yml up -d
```

---

## Troubleshooting

### OCR Issues
- Ensure `deu` language pack is loaded
- Check image quality (min 300 DPI recommended)
- Try Cloud Vision fallback for handwriting

### LLM Issues
- Verify API key is set
- Check rate limits
- Validate JSON output format

### Camera Issues
- Requires HTTPS in production
- Check browser permissions
- Test on actual mobile device

---

## Notes for Agent

1. **Don't skip steps** - Each task builds on previous ones
2. **Test incrementally** - Run `npm run dev` after each major change
3. **Commit often** - `git add -A && git commit -m "Task X.Y complete"`
4. **Ask if stuck** - Pause and request clarification rather than guessing
5. **German text** - All user-facing text should be in German
