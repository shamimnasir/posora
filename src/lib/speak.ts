/**
 * শুনে নাও - reading the page out loud.
 *
 * The site's youngest readers are five, and a five-year-old who can follow a
 * spoken explanation of the water cycle often cannot yet decode the sentence
 * that carries it. Until now there was nothing on পসরা for that child except
 * the pictures.
 *
 * This uses the browser's own speech synthesis, which costs nothing, ships no
 * audio files and sends no text anywhere: `speechSynthesis` runs on the
 * device. What it cannot do is conjure a Bangla voice that is not installed.
 *
 * So the one rule here is: **only ever speak Bangla in a Bangla voice.** An
 * English voice handed Bangla text produces confident nonsense, which for a
 * child being read to is worse than silence, and would quietly teach wrong
 * pronunciation. Where no Bangla voice exists the button does not appear and
 * the page says why, rather than offering something that will disappoint.
 *
 * Voice availability, for reference: iOS and macOS ship Bengali voices, most
 * Android devices have one through Google's speech services, and desktop
 * browsers on Windows and Linux usually do not.
 */

let cached: SpeechSynthesisVoice[] | null = null;
let listening = false;

const synth = (): SpeechSynthesis | null =>
  typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;

/**
 * The voice list arrives asynchronously in some browsers and synchronously in
 * others, so this resolves either way and caches the answer.
 */
export function voices(): Promise<SpeechSynthesisVoice[]> {
  const s = synth();
  if (!s) return Promise.resolve([]);
  const now = s.getVoices();
  if (now.length) { cached = now; return Promise.resolve(now); }
  if (cached) return Promise.resolve(cached);
  return new Promise((resolve) => {
    const done = () => { cached = s.getVoices(); resolve(cached); };
    if (!listening) { listening = true; s.addEventListener('voiceschanged', done, { once: true }); }
    else s.addEventListener('voiceschanged', done, { once: true });
    // Some browsers never fire the event when the list is already empty and
    // will stay empty, so do not wait forever for a voice that is not coming.
    setTimeout(() => resolve(s.getVoices()), 1200);
  });
}

/** The best Bangla voice on this device, or null when there is none. */
export async function banglaVoice(): Promise<SpeechSynthesisVoice | null> {
  const list = await voices();
  const bn = list.filter((v) => /^bn\b|^bn[-_]/i.test(v.lang));
  if (!bn.length) return null;
  // bn-BD before bn-IN: the words are the same but the accent is the reader's.
  return bn.find((v) => /bn[-_]BD/i.test(v.lang)) ?? bn[0]!;
}

export type Speaker = {
  /** Speak this text. Returns false when there is no Bangla voice. */
  say(text: string): boolean;
  stop(): void;
  speaking(): boolean;
};

/** Null when this device cannot read Bangla aloud, so callers can hide the control. */
export async function makeSpeaker(onEnd?: () => void): Promise<Speaker | null> {
  const s = synth();
  const voice = await banglaVoice();
  if (!s || !voice) return null;
  let live: SpeechSynthesisUtterance | null = null;
  return {
    say(text) {
      s.cancel();
      // Long readings are split on the danda: some engines silently truncate a
      // long utterance, and short ones also let stop() take effect promptly.
      const parts = text.split(/(?<=[।?!])\s*/).filter((p) => p.trim());
      parts.forEach((part, i) => {
        const u = new SpeechSynthesisUtterance(part);
        u.voice = voice; u.lang = voice.lang;
        // Slower than talking speed: this is being read to a child who is
        // following along, not a podcast.
        u.rate = 0.88; u.pitch = 1.02;
        if (i === parts.length - 1) u.addEventListener('end', () => { live = null; onEnd?.(); });
        live = u;
        s.speak(u);
      });
      return true;
    },
    stop() { s.cancel(); live = null; onEnd?.(); },
    speaking() { return s.speaking || !!live; },
  };
}
