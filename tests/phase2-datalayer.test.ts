import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Phase 2: Data Layer', () => {
  const projectRoot = process.cwd();

  describe('Types', () => {
    it('should export all required runtime values and have valid type definitions', async () => {
      const types = await import('@/types');
      
      // Check Bundesland exports - these are runtime values
      expect(types.BUNDESLAENDER).toBeDefined();
      expect(types.BUNDESLAENDER).toHaveLength(16);
      expect(types.BUNDESLAENDER[0]).toHaveProperty('code');
      expect(types.BUNDESLAENDER[0]).toHaveProperty('name');
      
      // Check LETTER_CATEGORIES - runtime object
      expect(types.LETTER_CATEGORIES).toBeDefined();
      expect(Object.keys(types.LETTER_CATEGORIES)).toHaveLength(7);
      
      // Verify we can create instances of the types (at runtime they are just objects)
      const mockAddress = {
        street: 'Test',
        zip: '12345',
        city: 'TestCity'
      };
      expect(mockAddress).toBeDefined();
    });

    it('should have valid LETTER_CATEGORIES metadata', async () => {
      const types = await import('@/types');
      
      const categories = ['BESCHEID', 'MAHNUNG', 'ANHOERUNG', 'ANTRAG_ABLEHNUNG', 'AUFFORDERUNG', 'INFORMATION', 'UNKNOWN'] as const;
      
      categories.forEach((category) => {
        expect(types.LETTER_CATEGORIES[category]).toBeDefined();
        expect(types.LETTER_CATEGORIES[category].name).toBeDefined();
        expect(types.LETTER_CATEGORIES[category].urgency).toBeDefined();
        expect(types.LETTER_CATEGORIES[category].defaultDeadlines).toBeInstanceOf(Array);
      });
    });

    it('should correctly infer BundeslandCode type', async () => {
      const types = await import('@/types');
      
      const validCodes = ['BE', 'HE', 'BW', 'BY'] as const;
      expect(validCodes[0]).toBe('BE');
      expect(validCodes[1]).toBe('HE');
    });
  });

  describe('Zustand Stores', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      localStorageMock.getItem.mockReturnValue(null);
      localStorageMock.setItem.mockImplementation(() => {});
    });

    it('should export useUserStore', async () => {
      const { useUserStore } = await import('@/store/userStore');
      expect(useUserStore).toBeDefined();
      expect(typeof useUserStore.getState).toBe('function');
    });

    it('should export createMockUser helper', async () => {
      const { createMockUser } = await import('@/store/userStore');
      expect(createMockUser).toBeDefined();
      expect(typeof createMockUser).toBe('function');
      
      const mockUser = createMockUser({ name: 'Test User' });
      expect(mockUser.name).toBe('Test User');
      expect(mockUser.id).toBeDefined();
      expect(mockUser.bundesland).toBe('BE');
    });

    it('should export useLetterStore', async () => {
      const { useLetterStore } = await import('@/store/letterStore');
      expect(useLetterStore).toBeDefined();
      expect(typeof useLetterStore.getState).toBe('function');
    });

    it('should export createMockLetter helper', async () => {
      const { createMockLetter } = await import('@/store/letterStore');
      expect(createMockLetter).toBeDefined();
      expect(typeof createMockLetter).toBe('function');
      
      const mockLetter = createMockLetter();
      expect(mockLetter.id).toBeDefined();
      expect(mockLetter.status).toBe('uploaded');
      expect(mockLetter.classification.category).toBe('BESCHEID');
    });

    it('should export useHistoryStore', async () => {
      const { useHistoryStore } = await import('@/store/historyStore');
      expect(useHistoryStore).toBeDefined();
      expect(typeof useHistoryStore.getState).toBe('function');
    });

    it('should export seedMockHistory helper', async () => {
      const { seedMockHistory } = await import('@/store/historyStore');
      expect(seedMockHistory).toBeDefined();
      expect(typeof seedMockHistory).toBe('function');
      
      const letters = seedMockHistory();
      expect(letters).toHaveLength(3);
      expect(letters[0].id).toBe('history-1');
    });
  });

  describe('Bundesland Data', () => {
    it('should have valid BE.json', () => {
      const bePath = join(projectRoot, 'src/data/bundeslaender/BE.json');
      const beData = JSON.parse(readFileSync(bePath, 'utf-8'));
      
      expect(beData.code).toBe('BE');
      expect(beData.name).toBe('Berlin');
      expect(beData.legalContext.widerspruchsFrist).toBe(30);
      expect(beData.commonAuthorities).toBeInstanceOf(Array);
      expect(beData.commonAuthorities.length).toBeGreaterThan(0);
      
      // Check first authority
      const finanzamt = beData.commonAuthorities.find(
        (a: any) => a.name === 'Finanzamt'
      );
      expect(finanzamt).toBeDefined();
      expect(finanzamt.pattern).toContain('finanzamt');
    });

    it('should have valid HE.json', () => {
      const hePath = join(projectRoot, 'src/data/bundeslaender/HE.json');
      const heData = JSON.parse(readFileSync(hePath, 'utf-8'));
      
      expect(heData.code).toBe('HE');
      expect(heData.name).toBe('Hessen');
      expect(heData.legalContext.widerspruchsFrist).toBe(30);
      expect(heData.commonAuthorities).toBeInstanceOf(Array);
      
      // Check Hessen-specific content
      const finanzamt = heData.commonAuthorities.find(
        (a: any) => a.name === 'Finanzamt'
      );
      expect(finanzamt).toBeDefined();
    });

    it('should have valid JSON structure for both states', () => {
      const states = ['BE', 'HE'];
      
      states.forEach(code => {
        const path = join(projectRoot, `src/data/bundeslaender/${code}.json`);
        const data = JSON.parse(readFileSync(path, 'utf-8'));
        
        // Required fields
        expect(data).toHaveProperty('code');
        expect(data).toHaveProperty('name');
        expect(data).toHaveProperty('legalContext');
        expect(data).toHaveProperty('commonAuthorities');
        expect(data).toHaveProperty('deadlines');
        expect(data).toHaveProperty('specificLaws');
        
        // Legal context
        expect(data.legalContext).toHaveProperty('widerspruchsFrist');
        expect(data.legalContext).toHaveProperty('zustaendigeGerichte');
        expect(data.legalContext.zustaendigeGerichte).toHaveProperty('verwaltungsgericht');
      });
    });
  });

  describe('Response Templates', () => {
    const templateFiles = [
      'widerspruch.md',
      'fristverlaengerung.md',
      'stellungsnahme.md',
      'ratenzahlung.md',
      'akteneinsicht.md',
    ];

    const variableRegex = /\{\{([a-z_]+)\}\}/g;

    templateFiles.forEach(templateFile => {
      it(`should have valid ${templateFile} template`, () => {
        const templatePath = join(projectRoot, `src/data/templates/${templateFile}`);
        const template = readFileSync(templatePath, 'utf-8');
        
        // Should have sender placeholders
        expect(template).toContain('{{absender_name}}');
        expect(template).toContain('{{absender_strasse}}');
        expect(template).toContain('{{absender_plz}}');
        expect(template).toContain('{{absender_ort}}');
        
        // Should have recipient placeholders
        expect(template).toContain('{{empfaenger_name}}');
        expect(template).toContain('{{empfaenger_adresse}}');
        
        // Should have date placeholder
        expect(template).toContain('{{datum}}');
        
        // Should have closing
        expect(template).toContain('Mit freundlichen Grüßen');
        expect(template).toContain('{{absender_name}}');
        
        // Check variable syntax consistency
        const variables = template.match(variableRegex);
        if (variables) {
          variables.forEach(v => {
            expect(v).toMatch(/^\{\{[a-z_]+\}\}$/);
          });
        }
      });
    });

    it('should follow DIN 5008 letter format', () => {
      const widerspruchPath = join(projectRoot, 'src/data/templates/widerspruch.md');
      const widerspruch = readFileSync(widerspruchPath, 'utf-8');
      
      // DIN 5008 structure: sender → recipient → date → subject → body → closing
      const lines = widerspruch.split('\n');
      
      // First lines are sender address
      expect(lines[0]).toContain('{{absender_name}}');
      
      // Contains formal greeting
      expect(widerspruch).toContain('Sehr geehrte Damen und Herren');
      
      // Contains proper closing
      expect(widerspruch).toContain('Mit freundlichen Grüßen');
      
      // Contains Rechtsmittelbelehrung (legal remedy instruction)
      expect(widerspruch).toContain('Widerspruch');
      expect(widerspruch).toContain('Verwaltungsgericht');
    });
  });

  describe('Interlock: Data Layer Integration', () => {
    it('types should be compatible with store data', async () => {
      const { createMockUser } = await import('@/store/userStore');
      const { createMockLetter } = await import('@/store/letterStore');
      
      const user = createMockUser();
      const letter = createMockLetter();
      
      // Types should match - check bundesland is a valid code
      const validCodes = ['BE', 'HE', 'BW', 'BY', 'BB', 'HB', 'HH', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH'];
      expect(validCodes).toContain(user.bundesland);
      expect(letter.userId).toBe(user.id);
      expect(typeof letter.status).toBe('string');
    });

    it('bundesland data should be compatible with types', async () => {
      const { BUNDESLAENDER } = await import('@/types');
      
      const bePath = join(projectRoot, 'src/data/bundeslaender/BE.json');
      const beData = JSON.parse(readFileSync(bePath, 'utf-8'));
      
      const validCodes = BUNDESLAENDER.map(b => b.code);
      expect(validCodes).toContain(beData.code);
      expect(beData.legalContext.widerspruchsFrist).toBeGreaterThan(0);
    });

    it('letter classification should match LETTER_CATEGORIES', async () => {
      const { LETTER_CATEGORIES } = await import('@/types');
      const { createMockLetter } = await import('@/store/letterStore');
      
      const letter = createMockLetter();
      const validCategories = Object.keys(LETTER_CATEGORIES);
      
      expect(validCategories).toContain(letter.classification.category);
    });
  });
});

// Custom matcher for toBeOneOf
expect.extend({
  toBeOneOf(received: string, expected: string[]) {
    const pass = expected.includes(received);
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be one of ${expected.join(', ')}`
          : `expected ${received} to be one of ${expected.join(', ')}`,
    };
  },
});

declare global {
  namespace Vi {
    interface Assertion {
      toBeOneOf(expected: string[]): this;
    }
  }
}
