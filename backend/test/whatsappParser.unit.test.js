/* @vitest-environment node */

import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isShiftOffer, parseShiftOffer } from '../services/whatsappParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesPath = path.join(__dirname, 'fixtures', 'whatsappMessages.br.json');
const fixtures = JSON.parse(fs.readFileSync(fixturesPath, 'utf8'));

describe('whatsapp parser shift offer detection', () => {
  it('detects new offer keywords including accent/case variations', () => {
    expect(isShiftOffer('COBERTURA UPA centro amanhã')).toBe(true);
    expect(isShiftOffer('Preciso Cobrir Plantão hoje')).toBe(true);
    expect(isShiftOffer('Troca de PLANTÃO 12x36')).toBe(true);
    expect(isShiftOffer('URGENTE: encaixe para médico')).toBe(true);
    expect(isShiftOffer('Disponibilidade imediata para plantao noturno')).toBe(true);
  });

  it('avoids false positives for regular chat text', () => {
    expect(isShiftOffer('Bom dia equipe, reunião às 8h')).toBe(false);
    expect(isShiftOffer('Alguém viu meu estetoscópio?')).toBe(false);
  });
});

describe('whatsapp parser extraction for informal formats', () => {
  it('extracts value from "R$ 1200 livre" format', () => {
    const offer = parseShiftOffer('Cobertura PS central, R$ 1200 livre', { groupName: 'Grupo Teste' });
    expect(offer.val).toBe(1200);
  });

  it('extracts duration from informal hour ranges', () => {
    expect(parseShiftOffer('Plantão clínica 7 às 19', {}).hours).toBe('12h');
    expect(parseShiftOffer('Plantao UTI 19h-7h', {}).hours).toBe('12h');
    expect(parseShiftOffer('Troca de plantão 12x36', {}).hours).toBe('12h');
    expect(parseShiftOffer('Cobertura 24h urgente', {}).hours).toBe('24h');
  });

  it('extracts hospital/local from abbreviations', () => {
    expect(parseShiftOffer('Cobertura UPA: Centro', {}).hospital).toBe('centro');
    expect(parseShiftOffer('Plantão PS - Zona Norte', {}).hospital).toBe('zona norte');
    expect(parseShiftOffer('Troca em Santa Casa de Misericórdia, valor 900', {}).hospital).toBe(
      'santa casa de misericordia',
    );
    expect(parseShiftOffer('Urgente H. São Lucas noite', {}).hospital).toBe('sao lucas noite');
  });
});

describe('whatsapp parser fixture recall', () => {
  it('matches expected offer labels from anonymized real fixtures', () => {
    for (const sample of fixtures) {
      expect(isShiftOffer(sample.text)).toBe(sample.expectedOffer);
    }
  });
});
