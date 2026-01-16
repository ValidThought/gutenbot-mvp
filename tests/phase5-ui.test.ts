import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';

// Mock router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    back: vi.fn(),
  })),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn().mockReturnValue(null),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Phase 5: UI Pages', () => {
  const projectRoot = process.cwd();

  describe('Onboarding Page', () => {
    it('should have onboarding page file', () => {
      const pagePath = join(projectRoot, 'src/app/onboarding/page.tsx');
      expect(() => readFileSync(pagePath, 'utf-8')).not.toThrow();
    });

    it('should use user store', () => {
      const pagePath = join(projectRoot, 'src/app/onboarding/page.tsx');
      const page = readFileSync(pagePath, 'utf-8');
      
      expect(page).toContain('useUserStore');
      expect(page).toContain('setProfile');
    });

    it('should have multi-step form', () => {
      const pagePath = join(projectRoot, 'src/app/onboarding/page.tsx');
      const page = readFileSync(pagePath, 'utf-8');
      
      expect(page).toContain("step === 'bundesland'");
      expect(page).toContain("step === 'personal'");
      expect(page).toContain("step === 'email'");
      expect(page).toContain("step === 'complete'");
    });

    it('should have Bundesland selection', () => {
      const pagePath = join(projectRoot, 'src/app/onboarding/page.tsx');
      const page = readFileSync(pagePath, 'utf-8');
      
      expect(page).toContain('BUNDESLAENDER');
      expect(page).toContain('updateFormData');
    });

    it('should have form validation', () => {
      const pagePath = join(projectRoot, 'src/app/onboarding/page.tsx');
      const page = readFileSync(pagePath, 'utf-8');
      
      expect(page).toContain('canProceed');
      expect(page).toContain('disabled={!canProceed()}');
    });

    it('should redirect if already onboarded', () => {
      const pagePath = join(projectRoot, 'src/app/onboarding/page.tsx');
      const page = readFileSync(pagePath, 'utf-8');
      
      expect(page).toContain('isOnboarded');
      expect(page).toContain("router.push('/scan')");
    });
  });

  describe('Scanner Page', () => {
    it('should have scanner page file', () => {
      const pagePath = join(projectRoot, 'src/app/scan/page.tsx');
      expect(() => readFileSync(pagePath, 'utf-8')).not.toThrow();
    });

    it('should use document scanner component', () => {
      const pagePath = join(projectRoot, 'src/app/scan/page.tsx');
      const page = readFileSync(pagePath, 'utf-8');
      
      expect(page).toContain('DocumentScanner');
    });

    it('should handle smart and upload modes', () => {
      const pagePath = join(projectRoot, 'src/app/scan/page.tsx');
      const page = readFileSync(pagePath, 'utf-8');
      
      expect(page).toContain("mode === 'smart'");
      expect(page).toContain("mode === 'upload'");
      expect(page).toContain("mode === 'preview'");
    });

    it('should show processing state', () => {
      const pagePath = join(projectRoot, 'src/app/scan/page.tsx');
      const page = readFileSync(pagePath, 'utf-8');
      
      expect(page).toContain('isProcessing');
      expect(page).toContain('Brief wird analysiert');
    });
  });

  describe('Analysis Page', () => {
    it('should have analysis page file', () => {
      const pagePath = join(projectRoot, 'src/app/analysis/new/page.tsx');
      expect(() => readFileSync(pagePath, 'utf-8')).not.toThrow();
    });

    it('should display classification results', () => {
      const pagePath = join(projectRoot, 'src/app/analysis/new/page.tsx');
      const page = readFileSync(pagePath, 'utf-8');
      
      expect(page).toContain('classification.category');
      expect(page).toContain('classification.subject');
      expect(page).toContain('classification.confidence');
    });

    it('should display deadlines', () => {
      const pagePath = join(projectRoot, 'src/app/analysis/new/page.tsx');
      const page = readFileSync(pagePath, 'utf-8');
      
      expect(page).toContain('classification.deadlines');
      expect(page).toContain('daysRemaining');
    });

    it('should display recommended actions', () => {
      const pagePath = join(projectRoot, 'src/app/analysis/new/page.tsx');
      const page = readFileSync(pagePath, 'utf-8');
      
      expect(page).toContain('recommendedActions');
      expect(page).toContain('handleSelectAction');
    });

    it('should navigate to compose on action selection', () => {
      const pagePath = join(projectRoot, 'src/app/analysis/new/page.tsx');
      const page = readFileSync(pagePath, 'utf-8');
      
      expect(page).toContain("router.push(`/compose/${actionId}`)");
    });
  });

  describe('Compose Page', () => {
    it('should have compose page file', () => {
      const pagePath = join(projectRoot, 'src/app/compose/[id]/page.tsx');
      expect(() => readFileSync(pagePath, 'utf-8')).not.toThrow();
    });

    it('should load templates from API', () => {
      const pagePath = join(projectRoot, 'src/app/compose/[id]/page.tsx');
      const page = readFileSync(pagePath, 'utf-8');
      
      expect(page).toContain("fetch('/api/templates'");
      expect(page).toContain("params.id");
    });

    it('should have template variable replacement', () => {
      const pagePath = join(projectRoot, 'src/app/compose/[id]/page.tsx');
      const page = readFileSync(pagePath, 'utf-8');
      
      expect(page).toContain('Object.entries(variables)');
      expect(page).toContain('absender_name');
    });

    it('should have copy and download actions', () => {
      const pagePath = join(projectRoot, 'src/app/compose/[id]/page.tsx');
      const page = readFileSync(pagePath, 'utf-8');
      
      expect(page).toContain('handleCopy');
      expect(page).toContain('handleDownload');
    });

    it('should have send functionality', () => {
      const pagePath = join(projectRoot, 'src/app/compose/[id]/page.tsx');
      const page = readFileSync(pagePath, 'utf-8');
      
      expect(page).toContain('handleSend');
      expect(page).toContain('isSending');
    });
  });

  describe('History Page', () => {
    it('should have history page file', () => {
      const pagePath = join(projectRoot, 'src/app/history/page.tsx');
      expect(() => readFileSync(pagePath, 'utf-8')).not.toThrow();
    });

    it('should use history store', () => {
      const pagePath = join(projectRoot, 'src/app/history/page.tsx');
      const page = readFileSync(pagePath, 'utf-8');
      
      expect(page).toContain('useHistoryStore');
      expect(page).toContain('letters');
    });

    it('should have search functionality', () => {
      const pagePath = join(projectRoot, 'src/app/history/page.tsx');
      const page = readFileSync(pagePath, 'utf-8');
      
      expect(page).toContain('searchQuery');
      expect(page).toContain('filteredLetters');
    });

    it('should have status filtering', () => {
      const pagePath = join(projectRoot, 'src/app/history/page.tsx');
      const page = readFileSync(pagePath, 'utf-8');
      
      expect(page).toContain('statusFilter');
      expect(page).toContain("status === 'completed'");
    });

    it('should display letter cards', () => {
      const pagePath = join(projectRoot, 'src/app/history/page.tsx');
      const page = readFileSync(pagePath, 'utf-8');
      
      expect(page).toContain('getStatusBadge');
      expect(page).toContain('getCategoryColor');
    });
  });

  describe('Interlock: UI → Data Layer', () => {
    it('pages should use data layer stores', () => {
      const pages = [
        'src/app/onboarding/page.tsx',
        'src/app/scan/page.tsx',
        'src/app/analysis/new/page.tsx',
        'src/app/compose/[id]/page.tsx',
        'src/app/history/page.tsx',
      ];

      pages.forEach(pagePath => {
        const path = join(projectRoot, pagePath);
        const content = readFileSync(path, 'utf-8');
        
        expect(content).toMatch(/from ['"]@\/store\//);
      });
    });

    it('pages should use types from data layer', () => {
      const pagePath = join(projectRoot, 'src/app/onboarding/page.tsx');
      const page = readFileSync(pagePath, 'utf-8');
      
      expect(page).toContain('BundeslandCode');
    });

    it('should load templates from API route', () => {
      const pagePath = join(projectRoot, 'src/app/compose/[id]/page.tsx');
      const page = readFileSync(pagePath, 'utf-8');
      
      expect(page).toContain("fetch('/api/templates'");
      expect(page).toContain('params.id');
    });
  });

  describe('UI Components', () => {
    it('should use shadcn/ui patterns', () => {
      const pagePath = join(projectRoot, 'src/app/onboarding/page.tsx');
      const page = readFileSync(pagePath, 'utf-8');
      
      expect(page).toContain('bg-background');
      expect(page).toContain('bg-card');
      expect(page).toContain('text-muted-foreground');
      expect(page).toContain('rounded-lg');
    });

    it('should use lucide-react icons', () => {
      const pages = [
        'src/app/onboarding/page.tsx',
        'src/app/scan/page.tsx',
        'src/app/history/page.tsx',
      ];

      pages.forEach(pagePath => {
        const path = join(projectRoot, pagePath);
        const content = readFileSync(path, 'utf-8');
        
        expect(content).toMatch(/from ['"]lucide-react['"]/);
      });
    });

    it('should use Next.js navigation', () => {
      const pages = [
        'src/app/onboarding/page.tsx',
        'src/app/scan/page.tsx',
        'src/app/analysis/new/page.tsx',
        'src/app/compose/[id]/page.tsx',
        'src/app/history/page.tsx',
      ];

      pages.forEach(pagePath => {
        const path = join(projectRoot, pagePath);
        const content = readFileSync(path, 'utf-8');
        
        expect(content).toContain("useRouter");
      });
    });
  });
});
