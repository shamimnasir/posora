/**
 * The game layer of a world page: levels, awards, a confetti canvas and a
 * few synthesized sounds. Everything here is computed from what the learner
 * actually did on the device; nothing is decorative or invented.
 */
import { bn } from './bn';

/* ---------- levels ---------- */
/** Cumulative জ্ঞানবিন্দু at which each title is reached. */
export const LEVELS: [number, string][] = [
  [0, 'নবীন'], [100, 'কৌতূহলী'], [300, 'চালাক'], [700, 'গবেষক'], [1500, 'বিজ্ঞানী'], [3000, 'ওস্তাদ'],
];
export function levelOf(xp: number): { n: number; title: string; next: number | null; frac: number } {
  let i = 0;
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1]![0]) i++;
  const here = LEVELS[i]![0], next = LEVELS[i + 1]?.[0] ?? null;
  return { n: i + 1, title: LEVELS[i]![1], next, frac: next === null ? 1 : (xp - here) / (next - here) };
}

/* ---------- awards ---------- */
export type AwardCtx = {
  seen: number; total: number; catsDone: number; played: boolean;
  questsDone: number; perfect: boolean; streak: number;
  missionsDone: number; missionsTotal: number;
};
/**
 * How close an unearned award is.
 *
 * A grid of eleven grey locks says "you have done nothing" and gives the eye
 * nowhere to go. Every award here is a threshold, so each can say how far off
 * it is, and the page can point at the nearest one instead of at all of them.
 */
export type AwardNear = { have: number; need: number; unit: string };
export type Award = {
  id: string; name: string; desc: string; emoji: string; global?: boolean;
  test(c: AwardCtx): boolean;
  near(c: AwardCtx): AwardNear;
};
export const AWARDS: Award[] = [
  { id: 'first', name: 'প্রথম আবিষ্কার', desc: 'একটা আইটেম খুলে দেখা', emoji: '🔦', test: (c) => c.seen >= 1, near: (c) => ({ have: c.seen, need: 1, unit: 'টা' }) },
  { id: 'ten', name: 'দশে দশ', desc: '১০টি আইটেম খুলে দেখা', emoji: '🔟', test: (c) => c.seen >= 10, near: (c) => ({ have: c.seen, need: 10, unit: 'টা' }) },
  { id: 'cat', name: 'একটা বিভাগ সম্পূর্ণ', desc: 'একটা বিভাগের সব আইটেম দেখা', emoji: '🧩', test: (c) => c.catsDone >= 1, near: (c) => ({ have: c.catsDone, need: 1, unit: 'বিভাগ' }) },
  { id: 'half', name: 'অর্ধেক পথ', desc: 'ভুবনের অর্ধেক আইটেম দেখা', emoji: '🌗', test: (c) => c.total > 0 && c.seen * 2 >= c.total, near: (c) => ({ have: c.seen, need: Math.ceil(c.total / 2), unit: 'টা' }) },
  { id: 'world', name: 'পুরো ভুবন', desc: 'এই ভুবনের সবকিছু দেখা', emoji: '🏆', test: (c) => c.total > 0 && c.seen >= c.total, near: (c) => ({ have: c.seen, need: c.total, unit: 'টা' }) },
  { id: 'play', name: 'হাতে-কলমে', desc: 'মডেল ঘুরিয়ে বা স্লাইডার টেনে দেখা', emoji: '🎛️', test: (c) => c.played, near: (c) => ({ have: c.played ? 1 : 0, need: 1, unit: 'বার' }) },
  { id: 'quest', name: 'খোঁজার খেলা', desc: 'একটা খোঁজার খেলা শেষ করা', emoji: '🎯', test: (c) => c.questsDone >= 1, near: (c) => ({ have: c.questsDone, need: 1, unit: 'খেলা' }) },
  { id: 'perfect', name: 'নিখুঁত খোঁজ', desc: 'একটাও ভুল না করে খেলা শেষ', emoji: '💯', test: (c) => c.perfect, near: (c) => ({ have: c.perfect ? 1 : 0, need: 1, unit: 'খেলা' }) },
  { id: 'mission', name: 'প্রথম মিশন', desc: 'একটা মিশন শেষ করা', emoji: '🚀', test: (c) => c.missionsDone >= 1, near: (c) => ({ have: c.missionsDone, need: 1, unit: 'মিশন' }) },
  { id: 'missions', name: 'মিশন মাস্টার', desc: 'এই ভুবনের সব মিশন শেষ করা', emoji: '🎖️', test: (c) => c.missionsTotal > 0 && c.missionsDone >= c.missionsTotal, near: (c) => ({ have: c.missionsDone, need: Math.max(1, c.missionsTotal), unit: 'মিশন' }) },
  { id: 'streak3', name: 'টানা তিন দিন', desc: 'পরপর তিন দিন ফিরে আসা', emoji: '🔥', global: true, test: (c) => c.streak >= 3, near: (c) => ({ have: c.streak, need: 3, unit: 'দিন' }) },
  { id: 'streak7', name: 'টানা সাত দিন', desc: 'পরপর সাত দিন ফিরে আসা', emoji: '🗓️', global: true, test: (c) => c.streak >= 7, near: (c) => ({ have: c.streak, need: 7, unit: 'দিন' }) },
];

/** The unearned award closest to being earned, if any is left. */
export function closestAward(c: AwardCtx, have: ReadonlySet<string>, world: string): { award: Award; near: AwardNear } | null {
  let best: { award: Award; near: AwardNear; frac: number } | null = null;
  for (const a of AWARDS) {
    if (have.has(awardKey(a, world)) || a.test(c)) continue;
    const n = a.near(c);
    const frac = n.need > 0 ? n.have / n.need : 0;
    if (!best || frac > best.frac) best = { award: a, near: n, frac };
  }
  return best ? { award: best.award, near: best.near } : null;
}
export const awardKey = (a: Award, world: string) => (a.global ? a.id : `${world}:${a.id}`);

/* ---------- stars for a খোঁজার খেলা round ---------- */
export const starsFor = (mistakes: number) => (mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1);
export const starText = (n: number) => '★'.repeat(n) + '☆'.repeat(3 - n);
export const secText = (ms: number) => `${bn(Math.round(ms / 1000))} সেকেন্ড`;

/* ---------- confetti on a 2D overlay ---------- */
type P = { x: number; y: number; vx: number; vy: number; r: number; c: string; a: number; s: number };
export function confetti(canvas: HTMLCanvasElement) {
  const g = canvas.getContext('2d')!;
  let ps: P[] = [], raf = 0, last = 0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function fit() { const r = canvas.getBoundingClientRect(); const d = Math.min(devicePixelRatio || 1, 2); canvas.width = r.width * d; canvas.height = r.height * d; g.setTransform(d, 0, 0, d, 0, 0); }
  function tick(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const r = canvas.getBoundingClientRect(); g.clearRect(0, 0, r.width, r.height);
    ps = ps.filter((p) => p.a > 0.02 && p.y < r.height + 20);
    for (const p of ps) {
      p.vy += 520 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.a -= dt * 0.55; p.s += dt * 6;
      g.globalAlpha = Math.max(0, p.a); g.fillStyle = p.c;
      g.beginPath(); g.ellipse(p.x, p.y, p.r, p.r * Math.abs(Math.cos(p.s)), p.s, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
    raf = ps.length ? requestAnimationFrame(tick) : 0;
  }
  return {
    /** A burst at (x, y) in canvas CSS pixels. `big` for a round won, small for one right answer. */
    burst(x: number, y: number, hue: string, big = false) {
      if (reduced) return;
      fit();
      const n = big ? 140 : 36, cols = [hue, '#f0b429', '#ffffff', '#ff6b8a', '#6bd3ff'];
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = (big ? 260 : 170) * (0.4 + Math.random());
        ps.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (big ? 220 : 120), r: 3 + Math.random() * 4, c: cols[i % cols.length]!, a: 1, s: Math.random() * 6 });
      }
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
    },
  };
}

/* ---------- tiny synthesized sounds, no files ---------- */
const SOUND_KEY = 'posora:sound';
export const soundOn = () => localStorage.getItem(SOUND_KEY) !== 'off';
export const setSound = (on: boolean) => localStorage.setItem(SOUND_KEY, on ? 'on' : 'off');
let ac: AudioContext | null = null;
function tone(f: number, at: number, len: number, type: OscillatorType = 'sine', gain = 0.08) {
  if (!ac) return;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, ac.currentTime + at);
  g.gain.exponentialRampToValueAtTime(gain, ac.currentTime + at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + at + len);
  o.connect(g).connect(ac.destination); o.start(ac.currentTime + at); o.stop(ac.currentTime + at + len + 0.02);
}
/** Must be called from a user gesture the first time, which every use here is. */
export function chime(kind: 'ok' | 'no' | 'win' | 'tick') {
  if (!soundOn()) return;
  try {
    ac ??= new AudioContext();
    if (ac.state === 'suspended') void ac.resume();
    if (kind === 'ok') { tone(660, 0, 0.12); tone(880, 0.09, 0.16); }
    else if (kind === 'no') { tone(220, 0, 0.18, 'triangle', 0.06); }
    else if (kind === 'tick') { tone(520, 0, 0.05, 'square', 0.03); }
    else { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.22)); tone(1319, 0.38, 0.5); }
  } catch { /* no audio is fine */ }
}
