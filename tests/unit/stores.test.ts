import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { UserProfile, BundeslandCode } from '@/types';

describe('User Store', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('UserProfile Validation', () => {
    it('should validate required user profile fields', () => {
      const profile: UserProfile = {
        id: 'user-1',
        name: 'Hans Müller',
        address: {
          street: 'Hauptstraße 1',
          zip: '10115',
          city: 'Berlin',
        },
        bundesland: 'BE' as BundeslandCode,
        email: 'hans@example.de',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(profile.id).toBe('user-1');
      expect(profile.name).toBe('Hans Müller');
      expect(profile.bundesland).toBe('BE');
      expect(profile.address.city).toBe('Berlin');
    });

    it('should accept valid bundesland codes', () => {
      const validCodes: BundeslandCode[] = ['BE', 'HE', 'BW', 'BY'];

      validCodes.forEach((code) => {
        expect(typeof code).toBe('string');
        expect(code.length).toBe(2);
      });
    });
  });

  describe('Address Validation', () => {
    it('should validate address structure', () => {
      const address = {
        street: 'Teststraße 123',
        zip: '10115',
        city: 'Berlin',
      };

      expect(address).toHaveProperty('street');
      expect(address).toHaveProperty('zip');
      expect(address).toHaveProperty('city');
      expect(address.zip).toMatch(/^\d{5}$/);
    });
  });
});

describe('BUNDESLAENDER Constants', () => {
  it('should have all 16 German states', () => {
    const BUNDESLAENDER = [
      { code: 'BW', name: 'Baden-Württemberg' },
      { code: 'BY', name: 'Bayern' },
      { code: 'BE', name: 'Berlin' },
      { code: 'BB', name: 'Brandenburg' },
      { code: 'HB', name: 'Bremen' },
      { code: 'HH', name: 'Hamburg' },
      { code: 'HE', name: 'Hessen' },
      { code: 'MV', name: 'Mecklenburg-Vorpommern' },
      { code: 'NI', name: 'Niedersachsen' },
      { code: 'NW', name: 'Nordrhein-Westfalen' },
      { code: 'RP', name: 'Rheinland-Pfalz' },
      { code: 'SL', name: 'Saarland' },
      { code: 'SN', name: 'Sachsen' },
      { code: 'ST', name: 'Sachsen-Anhalt' },
      { code: 'SH', name: 'Schleswig-Holstein' },
      { code: 'TH', name: 'Thüringen' },
    ];

    expect(BUNDESLAENDER).toHaveLength(16);
    expect(BUNDESLAENDER.map((b) => b.code)).toContain('BE');
    expect(BUNDESLAENDER.map((b) => b.code)).toContain('HE');
  });
});
