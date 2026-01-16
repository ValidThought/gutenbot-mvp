import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('Phase 7: Integration Testing', () => {
  const projectRoot = process.cwd();

  describe('Project Structure', () => {
    it('should have all required directories', () => {
      const requiredDirs = [
        'src/app',
        'src/app/api',
        'src/app/api/ocr',
        'src/app/api/analyze',
        'src/app/api/send',
        'src/app/onboarding',
        'src/app/scan',
        'src/app/analysis',
        'src/app/compose',
        'src/app/history',
        'src/components/ui',
        'src/lib/ocr',
        'src/lib/llm',
        'src/lib/utils',
        'src/store',
        'src/types',
        'src/hooks',
        'src/data/bundeslaender',
        'src/data/templates',
        'tests',
        'public',
      ];

      requiredDirs.forEach(dir => {
        const path = join(projectRoot, dir);
        expect(existsSync(path), `Directory ${dir} should exist`).toBe(true);
      });
    });

    it('should have all required files', () => {
      const requiredFiles = [
        'package.json',
        'tsconfig.json',
        'tailwind.config.js',
        'next.config.js',
        'vitest.config.ts',
        'src/app/layout.tsx',
        'src/app/page.tsx',
        'src/types/index.ts',
        'src/store/userStore.ts',
        'src/store/letterStore.ts',
        'src/store/historyStore.ts',
        'src/lib/ocr/tesseract.ts',
        'src/lib/llm/client.ts',
        'src/lib/llm/prompts.ts',
        'src/lib/llm/schemas.ts',
        'src/lib/utils/pdf.ts',
        'src/lib/utils/email.ts',
        'src/app/api/ocr/route.ts',
        'src/app/api/analyze/route.ts',
        'src/app/api/send/route.ts',
        'src/app/onboarding/page.tsx',
        'src/app/scan/page.tsx',
        'src/app/analysis/new/page.tsx',
        'src/app/compose/[id]/page.tsx',
        'src/app/history/page.tsx',
        'src/data/bundeslaender/BE.json',
        'src/data/bundeslaender/HE.json',
        'src/data/templates/widerspruch.md',
        'public/manifest.json',
      ];

      requiredFiles.forEach(file => {
        const path = join(projectRoot, file);
        expect(existsSync(path), `File ${file} should exist`).toBe(true);
      });
    });
  });

  describe('Interlock Verification', () => {
    it('types should be used consistently across modules', () => {
      const typeDefs = readFileSync(join(projectRoot, 'src/types/index.ts'), 'utf-8');
      const userStore = readFileSync(join(projectRoot, 'src/store/userStore.ts'), 'utf-8');
      const letterStore = readFileSync(join(projectRoot, 'src/store/letterStore.ts'), 'utf-8');
      
      expect(typeDefs).toContain('UserProfile');
      expect(typeDefs).toContain('Letter');
      expect(typeDefs).toContain('LetterClassification');
      expect(typeDefs).toContain('LetterAnalysis');
      expect(typeDefs).toContain('Deadline');
      expect(typeDefs).toContain('BundeslandCode');
      
      expect(userStore).toContain('UserProfile');
      expect(userStore).toContain('BundeslandCode');
      expect(letterStore).toContain('Letter');
      expect(letterStore).toContain('LetterStatus');
    });

    it('OCR output should match Analysis input', () => {
      const ocrRoute = readFileSync(join(projectRoot, 'src/app/api/ocr/route.ts'), 'utf-8');
      const analyzeRoute = readFileSync(join(projectRoot, 'src/app/api/analyze/route.ts'), 'utf-8');
      
      expect(ocrRoute).toContain('text:');
      expect(ocrRoute).toContain('confidence:');
      expect(analyzeRoute).toContain('text:');
      expect(analyzeRoute).toContain('POST');
    });

    it('Analysis output should match UI requirements', () => {
      const analyzeRoute = readFileSync(join(projectRoot, 'src/app/api/analyze/route.ts'), 'utf-8');
      const analysisPage = readFileSync(join(projectRoot, 'src/app/analysis/new/page.tsx'), 'utf-8');
      
      expect(analyzeRoute).toContain('classification');
      expect(analyzeRoute).toContain('recommendedActions');
      expect(analysisPage).toContain('classification.category');
      expect(analysisPage).toContain('classification.subject');
      expect(analysisPage).toContain('recommendedActions');
    });

    it('Compose should use templates API and user data', () => {
      const composePage = readFileSync(join(projectRoot, 'src/app/compose/[id]/page.tsx'), 'utf-8');
      const userStore = readFileSync(join(projectRoot, 'src/store/userStore.ts'), 'utf-8');
      
      expect(composePage).toContain("fetch('/api/templates'");
      expect(composePage).toContain('Object.entries(variables)');
      expect(composePage).toContain('useUserStore');
      expect(composePage).toContain('profile.name');
      expect(composePage).toContain('profile.address');
    });

    it('Send API should accept compose output', () => {
      const sendRoute = readFileSync(join(projectRoot, 'src/app/api/send/route.ts'), 'utf-8');
      const composePage = readFileSync(join(projectRoot, 'src/app/compose/[id]/page.tsx'), 'utf-8');
      
      expect(sendRoute).toContain('letterContent');
      expect(sendRoute).toContain('sender');
      expect(composePage).toContain('letterContent');
    });

    it('All API routes should have error handling', () => {
      const apiRoutes = [
        'src/app/api/ocr/route.ts',
        'src/app/api/analyze/route.ts',
        'src/app/api/send/route.ts',
      ];
      
      apiRoutes.forEach(route => {
        const content = readFileSync(join(projectRoot, route), 'utf-8');
        expect(content).toContain('try');
        expect(content).toContain('catch');
        expect(content).toContain('error');
        expect(content).toContain('500');
      });
    });
  });

  describe('Data Layer Consistency', () => {
    it('should have BE and HE legal data', () => {
      const beData = JSON.parse(readFileSync(join(projectRoot, 'src/data/bundeslaender/BE.json'), 'utf-8'));
      const heData = JSON.parse(readFileSync(join(projectRoot, 'src/data/bundeslaender/HE.json'), 'utf-8'));
      
      expect(beData.code).toBe('BE');
      expect(beData.legalContext.widerspruchsFrist).toBe(30);
      
      expect(heData.code).toBe('HE');
      expect(heData.legalContext.widerspruchsFrist).toBe(30);
    });

    it('should have all required templates', () => {
      const requiredTemplates = [
        'widerspruch.md',
        'fristverlaengerung.md',
        'stellungsnahme.md',
        'ratenzahlung.md',
        'akteneinsicht.md',
      ];
      
      requiredTemplates.forEach(template => {
        const path = join(projectRoot, 'src/data/templates', template);
        expect(existsSync(path), `Template ${template} should exist`).toBe(true);
        
        const content = readFileSync(path, 'utf-8');
        expect(content).toContain('{{absender_name}}');
        expect(content).toContain('Sehr geehrte');
        expect(content).toContain('Mit freundlichen Grüßen');
      });
    });

    it('should have valid LETTER_CATEGORIES', () => {
      const types = readFileSync(join(projectRoot, 'src/types/index.ts'), 'utf-8');
      
      expect(types).toContain('BESCHEID');
      expect(types).toContain('MAHNUNG');
      expect(types).toContain('ANHOERUNG');
      expect(types).toContain('ANTRAG_ABLEHNUNG');
      expect(types).toContain('AUFFORDERUNG');
      expect(types).toContain('INFORMATION');
      expect(types).toContain('UNKNOWN');
    });
  });

  describe('Configuration Files', () => {
    it('should have valid package.json', () => {
      const pkg = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf-8'));
      
      expect(pkg.name).toBe('gutenbot');
      expect(pkg.dependencies).toBeDefined();
      expect(pkg.devDependencies).toBeDefined();
      expect(pkg.scripts).toHaveProperty('dev');
      expect(pkg.scripts).toHaveProperty('build');
      expect(pkg.scripts).toHaveProperty('test');
      expect(pkg.scripts).toHaveProperty('typecheck');
    });

    it('should have valid tsconfig.json', () => {
      const tsconfig = JSON.parse(readFileSync(join(projectRoot, 'tsconfig.json'), 'utf-8'));
      
      expect(tsconfig.compilerOptions.strict).toBe(true);
      expect(tsconfig.compilerOptions.paths).toHaveProperty('@/*');
    });

    it('should have PWA in next.config.js', () => {
      const nextConfig = readFileSync(join(projectRoot, 'next.config.js'), 'utf-8');
      
      expect(nextConfig).toContain('next-pwa');
      expect(nextConfig).toContain('register:');
      expect(nextConfig).toContain('skipWaiting:');
    });

    it('should have .env.example', () => {
      const envExample = readFileSync(join(projectRoot, '.env.example'), 'utf-8');
      
      expect(envExample).toContain('ANTHROPIC_API_KEY');
      expect(envExample).toContain('SMTP_HOST');
      expect(envExample).toContain('NEXT_PUBLIC_APP_URL');
    });
  });

  describe('UI Components', () => {
    it('all pages should use client components', () => {
      const pages = [
        'src/app/onboarding/page.tsx',
        'src/app/scan/page.tsx',
        'src/app/analysis/new/page.tsx',
        'src/app/compose/[id]/page.tsx',
        'src/app/history/page.tsx',
      ];
      
      pages.forEach(page => {
        const content = readFileSync(join(projectRoot, page), 'utf-8');
        expect(content).toContain("'use client'");
      });
    });

    it('all pages should use Next.js navigation', () => {
      const pages = [
        'src/app/onboarding/page.tsx',
        'src/app/scan/page.tsx',
        'src/app/analysis/new/page.tsx',
        'src/app/compose/[id]/page.tsx',
        'src/app/history/page.tsx',
      ];
      
      pages.forEach(page => {
        const content = readFileSync(join(projectRoot, page), 'utf-8');
        expect(content).toContain('useRouter');
      });
    });

    it('should use shadcn/ui styling patterns', () => {
      const content = readFileSync(join(projectRoot, 'src/app/onboarding/page.tsx'), 'utf-8');
      
      expect(content).toContain('bg-background');
      expect(content).toContain('bg-card');
      expect(content).toContain('text-muted-foreground');
      expect(content).toContain('rounded-lg');
    });
  });

  describe('PWA Configuration', () => {
    it('should have manifest.json', () => {
      const manifest = JSON.parse(readFileSync(join(projectRoot, 'public/manifest.json'), 'utf-8'));
      
      expect(manifest.name).toContain('GutenBot');
      expect(manifest.display).toBe('standalone');
      expect(manifest.icons).toBeInstanceOf(Array);
    });

    it('should have icons directory', () => {
      const iconsPath = join(projectRoot, 'public/icons');
      expect(existsSync(iconsPath)).toBe(true);
    });
  });
});
