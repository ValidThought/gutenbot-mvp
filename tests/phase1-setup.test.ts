import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Phase 1: Project Setup', () => {
  const projectRoot = path.resolve(__dirname, '..');

  describe('Configuration Files', () => {
    it('should have valid next.config.js', () => {
      const configPath = path.join(projectRoot, 'next.config.js');
      const config = fs.readFileSync(configPath, 'utf-8');
      expect(config).toContain('next-pwa');
      expect(config).toContain('dest:');
      expect(config).toContain('register:');
    });

    it('should have valid tsconfig.json', () => {
      const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      expect(tsconfig.compilerOptions.paths).toHaveProperty('@/*');
      expect(tsconfig.compilerOptions.strict).toBe(true);
    });

    it('should have valid tailwind.config.js', () => {
      const tailwindPath = path.join(projectRoot, 'tailwind.config.js');
      const tailwind = fs.readFileSync(tailwindPath, 'utf-8');
      expect(tailwind).toContain('tailwindcss');
      expect(tailwind).toContain('tailwindcss-animate');
    });

    it('should have valid postcss.config.js', () => {
      const postcssPath = path.join(projectRoot, 'postcss.config.js');
      const postcss = fs.readFileSync(postcssPath, 'utf-8');
      expect(postcss).toContain('tailwindcss');
      expect(postcss).toContain('autoprefixer');
    });

    it('should have .env.example file', () => {
      const envExamplePath = path.join(projectRoot, '.env.example');
      const envExample = fs.readFileSync(envExamplePath, 'utf-8');
      expect(envExample).toContain('ANTHROPIC_API_KEY');
      expect(envExample).toContain('NEXT_PUBLIC_APP_URL');
    });

    it('should have .env.local file', () => {
      const envLocalPath = path.join(projectRoot, '.env.local');
      expect(fs.existsSync(envLocalPath)).toBe(true);
    });

    it('should have .gitignore file', () => {
      const gitignorePath = path.join(projectRoot, '.gitignore');
      const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
      expect(gitignore).toContain('node_modules');
      expect(gitignore).toContain('.env.local');
    });
  });

  describe('Directory Structure', () => {
    const requiredDirs = [
      'src/app',
      'src/app/api',
      'src/app/api/ocr',
      'src/app/api/analyze',
      'src/app/api/generate',
      'src/app/api/send',
      'src/app/onboarding',
      'src/app/scan',
      'src/app/analysis',
      'src/app/compose',
      'src/app/history',
      'src/components/ui',
      'src/components/onboarding',
      'src/components/scanner',
      'src/components/analysis',
      'src/components/compose',
      'src/lib/ocr',
      'src/lib/llm',
      'src/lib/legal',
      'src/lib/utils',
      'src/data/bundeslaender',
      'src/data/templates',
      'src/hooks',
      'src/store',
      'src/types',
      'public/icons',
      'tests/fixtures',
    ];

    requiredDirs.forEach(dir => {
      it(`should have ${dir} directory`, () => {
        const dirPath = path.join(projectRoot, dir);
        expect(fs.existsSync(dirPath), `Directory ${dir} should exist`).toBe(true);
      });
    });
  });

  describe('App Files', () => {
    it('should have layout.tsx with PWA meta', () => {
      const layoutPath = path.join(projectRoot, 'src/app/layout.tsx');
      const layout = fs.readFileSync(layoutPath, 'utf-8');
      expect(layout).toContain('manifest:');
      expect(layout).toContain('GutenBot');
    });

    it('should have globals.css with Tailwind', () => {
      const cssPath = path.join(projectRoot, 'src/app/globals.css');
      const css = fs.readFileSync(cssPath, 'utf-8');
      expect(css).toContain('@tailwind base');
      expect(css).toContain('@tailwind components');
      expect(css).toContain('@tailwind utilities');
    });

    it('should have landing page', () => {
      const pagePath = path.join(projectRoot, 'src/app/page.tsx');
      const page = fs.readFileSync(pagePath, 'utf-8');
      expect(page).toContain('GutenBot');
      expect(page).toContain('onboarding');
    });

    it('should have PWA manifest', () => {
      const manifestPath = path.join(projectRoot, 'public/manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      expect(manifest.name).toContain('GutenBot');
      expect(manifest.display).toBe('standalone');
      expect(manifest.icons).toBeInstanceOf(Array);
    });
  });

  describe('Package.json', () => {
    it('should have all required dependencies', () => {
      const packagePath = path.join(projectRoot, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      
      const coreDeps = [
        'next',
        'react',
        'react-dom',
        'zustand',
        '@anthropic-ai/sdk',
        'tesseract.js',
        'zod',
        'date-fns',
        'pdf-lib',
        'nodemailer',
      ];
      
      coreDeps.forEach(dep => {
        expect(pkg.dependencies).toHaveProperty(dep);
      });
    });

    it('should have all required devDependencies', () => {
      const packagePath = path.join(projectRoot, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      
      const devDeps = [
        'typescript',
        'tailwindcss',
        'eslint',
        'vitest',
      ];
      
      devDeps.forEach(dep => {
        expect(pkg.devDependencies).toHaveProperty(dep);
      });
    });

    it('should have required scripts', () => {
      const packagePath = path.join(projectRoot, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      
      expect(pkg.scripts).toHaveProperty('dev');
      expect(pkg.scripts).toHaveProperty('build');
      expect(pkg.scripts).toHaveProperty('start');
      expect(pkg.scripts).toHaveProperty('test');
      expect(pkg.scripts).toHaveProperty('typecheck');
    });
  });
});
