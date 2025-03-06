import { getNoteInfo } from '../utils/noteUtils';
import { describe, it, expect } from '@jest/globals';

describe('Pitch Detection Accuracy', () => {
  it('should correctly identify the note and cents difference for A4 (440 Hz)', () => {
    const frequency = 440;
    const { note, centsOff } = getNoteInfo(frequency);
    expect(note).toBe('A4');
    expect(centsOff).toBeCloseTo(0, 1);
  });

  it('should correctly identify the note and cents difference for C4 (261.63 Hz)', () => {
    const frequency = 261.63;
    const { note, centsOff } = getNoteInfo(frequency);
    expect(note).toBe('C4');
    expect(centsOff).toBeCloseTo(0, 1);
  });

  it('should correctly identify the note and cents difference for G4 (392 Hz)', () => {
    const frequency = 392;
    const { note, centsOff } = getNoteInfo(frequency);
    expect(note).toBe('G4');
    expect(centsOff).toBeCloseTo(0, 1);
  });

  it('should correctly identify the note and cents difference for F4 (349.23 Hz)', () => {
    const frequency = 349.23;
    const { note, centsOff } = getNoteInfo(frequency);
    expect(note).toBe('F4');
    expect(centsOff).toBeCloseTo(0, 1);
  });

  it('should correctly identify the note and cents difference for A3 (220 Hz)', () => {
    const frequency = 220;
    const { note, centsOff } = getNoteInfo(frequency);
    expect(note).toBe('A3');
    expect(centsOff).toBeCloseTo(0, 1);
  });

  it('should correctly identify the note and cents difference for C5 (523.25 Hz)', () => {
    const frequency = 523.25;
    const { note, centsOff } = getNoteInfo(frequency);
    expect(note).toBe('C5');
    expect(centsOff).toBeCloseTo(0, 1);
  });

  it('should correctly identify the note and cents difference for G3 (196 Hz)', () => {
    const frequency = 196;
    const { note, centsOff } = getNoteInfo(frequency);
    expect(note).toBe('G3');
    expect(centsOff).toBeCloseTo(0, 1);
  });

  it('should correctly identify the note and cents difference for F5 (698.46 Hz)', () => {
    const frequency = 698.46;
    const { note, centsOff } = getNoteInfo(frequency);
    expect(note).toBe('F5');
    expect(centsOff).toBeCloseTo(0, 1);
  });
});
