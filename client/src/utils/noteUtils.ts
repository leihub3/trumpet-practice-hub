import { noteFrequenciesSharps, noteFrequenciesFlats } from './noteFrequencies';

export function getUpdatedFrequencies(newA4: number, useSharps = true) {
  const noteFrequencies = useSharps ? noteFrequenciesSharps : noteFrequenciesFlats;
  const scaleFactor = newA4 / 440;

  return Object.fromEntries(
    Object.entries(noteFrequencies).map(([note, frequency]) => [
      note,
      +(frequency * scaleFactor).toFixed(2), // Keeping two decimal places
    ]),
  );
}

export function getNoteInfo(frequency: number, useSharps = true, a4Frequency = 440) {
  const noteFrequencies = getUpdatedFrequencies(a4Frequency, useSharps);
  let closestNote = '';
  let minDifference = Infinity;
  let centsOff = 0;

  for (const [note, noteFrequency] of Object.entries(noteFrequencies)) {
    const difference = Math.abs(frequency - noteFrequency);
    if (difference < minDifference) {
      minDifference = difference;
      closestNote = note;
      centsOff = 1200 * Math.log2(frequency / noteFrequency);
    }
  }

  return { note: closestNote, centsOff };
}
