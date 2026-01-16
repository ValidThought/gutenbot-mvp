import { describe, it, expect } from 'vitest';
import { format, addDays, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';

describe('Date Utilities', () => {
  describe('German Date Formatting', () => {
    it('should format dates in German format', () => {
      const date = new Date(2025, 0, 15);
      const formatted = format(date, 'dd.MM.yyyy');
      expect(formatted).toBe('15.01.2025');
    });

    it('should format dates with German locale', () => {
      const date = new Date(2025, 1, 14);
      const formatted = format(date, 'EEEE, d. MMMM yyyy', { locale: de });
      expect(formatted).toContain('Februar');
    });

    it('should calculate days remaining correctly', () => {
      const today = new Date();
      const deadline = addDays(today, 14);
      const daysRemaining = differenceInDays(deadline, today);
      expect(daysRemaining).toBe(14);
    });

    it('should handle negative days remaining', () => {
      const today = new Date();
      const deadline = addDays(today, -5);
      const daysRemaining = differenceInDays(deadline, today);
      expect(daysRemaining).toBe(-5);
    });
  });

  describe('Frist Calculation', () => {
    it('should calculate Widerspruchsfrist (30 days)', () => {
      const receivedDate = new Date(2025, 0, 1);
      const fristEnd = addDays(receivedDate, 30);
      expect(differenceInDays(fristEnd, receivedDate)).toBe(30);
    });

    it('should calculate Zahlungsfrist (14 days)', () => {
      const receivedDate = new Date(2025, 0, 1);
      const fristEnd = addDays(receivedDate, 14);
      expect(differenceInDays(fristEnd, receivedDate)).toBe(14);
    });

    it('should calculate Stellungnahmefrist (14 days)', () => {
      const receivedDate = new Date(2025, 0, 1);
      const fristEnd = addDays(receivedDate, 14);
      expect(differenceInDays(fristEnd, receivedDate)).toBe(14);
    });
  });
});

describe('Template Variables', () => {
  it('should replace template variables correctly', () => {
    const template = `{{absender_name}}
{{absender_strasse}}
{{absender_plz}} {{absender_ort}}

{{empfaenger_name}}
{{empfaenger_adresse}}

{{datum}}`;

    const replacements = {
      '{{absender_name}}': 'Hans Müller',
      '{{absender_strasse}}': 'Hauptstraße 1',
      '{{absender_plz}}': '10115',
      '{{absender_ort}}': 'Berlin',
      '{{empfaenger_name}}': 'Finanzamt Berlin',
      '{{empfaenger_adresse}}': 'Kaiserdamm 23, 14057 Berlin',
      '{{datum}}': '15.01.2025',
    };

    let result = template;
    Object.entries(replacements).forEach(([placeholder, value]) => {
      result = result.replace(new RegExp(placeholder, 'g'), value);
    });

    expect(result).toContain('Hans Müller');
    expect(result).toContain('10115 Berlin');
    expect(result).toContain('15.01.2025');
  });
});
