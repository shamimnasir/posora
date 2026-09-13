/**
 * Every number in the panel owns a little animation that explains it.
 *
 * Each one is drawn from the body's real figures - the falling-ball race uses
 * the actual surface gravity, the light beam uses the actual distance in AU -
 * so the picture and the number can never drift apart.
 */
const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const toBn = (v: string | number) => String(v).replace(/\d/g, (d) => BN_DIGITS[+d]);

/** Bangla numerals (and the minus sign we use) out of a stat value. */
export function parseNum(s: string): number | null {
  const latin = s.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d))).replace(/[−–—]/g, '-');
  const m = latin.match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

export type VizKind = 'gravity' | 'temp' | 'moons' | 'distance' | 'spin' | 'orbit' | 'bar';

/** Which animation a stat row gets, from its Bangla label. */
export function kindFor(k: string): VizKind {
  if (k.includes('মাধ্যাকর্ষণ')) return 'gravity';
  if (k.includes('তাপমাত্রা') || k.includes('তাপ')) return 'temp';
  if (k.includes('চাঁদ')) return 'moons';
  if (k.includes('দূরত্ব')) return 'distance';
  if (k.includes('দিন') || k.includes('ঘুরতে')) return 'spin';
  if (k.includes('বছর')) return 'orbit';
  return 'bar';
}

export type VizOpts = {
  kind: VizKind;
  /** The number parsed out of the stat value. */
  value: number | null;
  /** Normalised 0-1 bar length that ships with every stat. */
  s: number;
  bodyName: string;
  hue: string;
  gravity: number;
  au: number | null;
  /** Raw stat label + value, for the fallback bar. */
  k: string;
  v: string;
};

export type VizHandle = { destroy(): void; caption: string };

const css = (name: string, fallback: string) => {
  const v = getComputedStyle(document.body).getPropertyValue(name).trim();
  return v || fallback;
};

export function mountStatViz(canvas: HTMLCanvasElement, o: VizOpts): VizHandle {
  const ctx = canvas.getContext('2d')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, raf = 0, t0 = performance.now();

  const ink = () => css('--ink', '#111820');
  const muted = () => css('--muted', '#6b7987');
  const line = () => css('--line', '#d2dae3');
  const sunk = () => css('--sunk', '#e0e6ed');

  function size() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const ro = new ResizeObserver(size); ro.observe(canvas); size();

  /* ---------- captions: the real arithmetic, stated ---------- */
  const fallTime = (g: number) => Math.sqrt((2 * 10) / (9.8 * Math.max(g, 0.001))); // 10 m drop
  let caption = '';
  if (o.kind === 'gravity') {
    const tE = fallTime(1), tB = fallTime(o.gravity);
    caption = `১০ মিটার উপর থেকে ছেড়ে দিলে পৃথিবীতে পড়তে লাগে ${toBn(tE.toFixed(1))} সেকেন্ড, ${o.bodyName}ে লাগে ${toBn(tB.toFixed(1))} সেকেন্ড।`;
  } else if (o.kind === 'temp') {
    const c = o.value ?? 0;
    caption = c > 100 ? `পানি এখানে সঙ্গে সঙ্গে ফুটে বাষ্প হয়ে যেত - ফোটার তাপমাত্রার চেয়ে ${toBn(Math.round(c - 100))}° বেশি।`
      : c < 0 ? `পানি জমে বরফ - বরফ গলার তাপমাত্রার চেয়ে ${toBn(Math.round(Math.abs(c)))}° নিচে।`
      : `পানি এখানে তরলই থাকত - বরফ গলা আর ফোটার মাঝামাঝি।`;
  } else if (o.kind === 'moons') {
    const n = o.value ?? 0;
    caption = n === 0 ? 'এর কোনো চাঁদ নেই - একা একাই সূর্যকে ঘোরে।' : `${toBn(n)}টি চাঁদ এটিকে ঘিরে ঘোরে। পৃথিবীর আছে মাত্র ১টি।`;
  } else if (o.kind === 'distance') {
    const au = o.au ?? 0;
    const mins = au * 8.317;
    caption = au === 0 ? 'এখান থেকেই আলো ছড়ায় - পৃথিবীতে পৌঁছাতে ৮ মিনিট ২০ সেকেন্ড।'
      : mins < 60 ? `সূর্যের আলো এখানে পৌঁছাতে ${toBn(Math.round(mins))} মিনিট লাগে।`
      : `সূর্যের আলো এখানে পৌঁছাতে ${toBn((mins / 60).toFixed(1))} ঘণ্টা লাগে।`;
  } else if (o.kind === 'spin') {
    caption = `একবার নিজের অক্ষে ঘুরতে লাগে ${o.v}। পৃথিবীর লাগে ২৪ ঘণ্টা।`;
  } else if (o.kind === 'orbit') {
    caption = `সূর্যকে একবার ঘুরতে লাগে ${o.v}। পৃথিবীর লাগে ৩৬৫ দিন।`;
  } else {
    caption = `${o.k}: ${o.v}`;
  }

  /* ---------- drawing ---------- */
  function draw(now: number) {
    // clamped at zero: the first rAF timestamp can predate the
    // `performance.now()` taken just before it, and a negative t here reaches
    // `fillRect` as a negative width, which canvas draws leftward out of the
    // chart. See heroes.ts for why the timestamp runs backwards at all.
    const t = reduced ? 0 : Math.max(0, (now - t0) / 1000);
    ctx.clearRect(0, 0, W, H);
    ctx.textBaseline = 'middle';

    if (o.kind === 'gravity') {
      const lanes = [{ x: W * 0.3, g: 1, nm: 'পৃথিবী' }, { x: W * 0.7, g: o.gravity, nm: o.bodyName }];
      for (const L of lanes) {
        ctx.strokeStyle = line(); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(L.x, 14); ctx.lineTo(L.x, H - 22); ctx.stroke();
        // s = ½gt², normalised so Earth's drop takes ~1.4s of screen time
        const T = fallTime(L.g), phase = (t % (T + 0.5)) / 1;
        const y = Math.min(1, (0.5 * 9.8 * L.g * phase * phase) / 10);
        ctx.fillStyle = L.g === 1 ? muted() : o.hue;
        ctx.beginPath(); ctx.arc(L.x, 14 + y * (H - 40), 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = muted(); ctx.font = '10px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(L.nm, L.x, H - 8);
      }
      ctx.strokeStyle = sunk(); ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(10, H - 22); ctx.lineTo(W - 10, H - 22); ctx.stroke(); ctx.setLineDash([]);
    }

    else if (o.kind === 'temp') {
      const MIN = -250, MAX = 500, c = Math.max(MIN, Math.min(MAX, o.value ?? 0));
      const x = (v: number) => 14 + ((v - MIN) / (MAX - MIN)) * (W - 28);
      const g = ctx.createLinearGradient(14, 0, W - 14, 0);
      g.addColorStop(0, '#4a7ddb'); g.addColorStop(0.33, '#7fc8e8'); g.addColorStop(0.55, '#f0b429'); g.addColorStop(1, '#d23b4b');
      ctx.fillStyle = g; ctx.fillRect(14, H * 0.42, W - 28, 10);
      ctx.font = '9px system-ui'; ctx.textAlign = 'center';
      for (const [v, lab] of [[0, 'বরফ'], [100, 'ফোটে']] as const) {
        ctx.strokeStyle = line(); ctx.beginPath(); ctx.moveTo(x(v), H * 0.42); ctx.lineTo(x(v), H * 0.42 + 16); ctx.stroke();
        ctx.fillStyle = muted(); ctx.fillText(lab, x(v), H * 0.42 + 26);
      }
      const px = x(c), pulse = 1 + Math.sin(t * 3) * 0.12;
      ctx.fillStyle = ink();
      ctx.beginPath(); ctx.arc(px, H * 0.42 + 5, 7 * pulse, 0, Math.PI * 2); ctx.fill();
      ctx.font = '700 12px system-ui'; ctx.fillText(`${toBn(Math.round(c))}°`, px, H * 0.2);
    }

    else if (o.kind === 'moons') {
      const n = Math.min(o.value ?? 0, 12), cx = W / 2, cy = H / 2;
      ctx.fillStyle = o.hue; ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < n; i++) {
        const r = 24 + (i % 3) * 13, a = t * (0.7 - (i % 3) * 0.15) + (i / n) * Math.PI * 2;
        ctx.strokeStyle = sunk(); ctx.lineWidth = 1;
        if (i < 3) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); }
        ctx.fillStyle = muted();
        ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.55, 3.5, 0, Math.PI * 2); ctx.fill();
      }
      if ((o.value ?? 0) > 12) {
        ctx.fillStyle = muted(); ctx.font = '10px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(`+ আরও ${toBn((o.value ?? 0) - 12)}টি`, cx, H - 8);
      }
    }

    else if (o.kind === 'distance') {
      const y = H / 2;
      ctx.fillStyle = '#f0b429'; ctx.beginPath(); ctx.arc(18, y, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = o.hue; ctx.beginPath(); ctx.arc(W - 18, y, 8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = sunk(); ctx.setLineDash([2, 4]);
      ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(W - 30, y); ctx.stroke(); ctx.setLineDash([]);
      const p = (t * 0.45) % 1, px = 30 + p * (W - 60);
      const grd = ctx.createRadialGradient(px, y, 0, px, y, 9);
      grd.addColorStop(0, '#fff'); grd.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(px, y, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd76a'; ctx.beginPath(); ctx.arc(px, y, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = muted(); ctx.font = '10px system-ui'; ctx.textAlign = 'center';
      ctx.fillText('সূর্য', 18, y + 22); ctx.fillText(o.bodyName, W - 18, y + 22);
    }

    else if (o.kind === 'spin' || o.kind === 'orbit') {
      // Earth on the left at a fixed rate, this body on the right at its real relative rate.
      const earthRef = o.kind === 'spin' ? 24 : 365;        // hours / days
      let mine = o.value ?? earthRef;
      if (o.kind === 'spin' && /দিন/.test(o.v)) mine *= 24;  // "৫৯ পৃথিবী-দিন" -> hours
      if (o.kind === 'orbit' && /বছর/.test(o.v)) mine *= 365;
      const rel = Math.max(0.04, Math.min(8, earthRef / Math.max(mine, 0.01)));
      const pairs = [{ cx: W * 0.3, sp: 1, nm: 'পৃথিবী', col: muted() }, { cx: W * 0.7, sp: rel, nm: o.bodyName, col: o.hue }];
      for (const P of pairs) {
        const cy = H / 2 - 6, R = 20;
        ctx.strokeStyle = sunk(); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(P.cx, cy, R, 0, Math.PI * 2); ctx.stroke();
        if (o.kind === 'orbit') { ctx.fillStyle = '#f0b429'; ctx.beginPath(); ctx.arc(P.cx, cy, 5, 0, Math.PI * 2); ctx.fill(); }
        const a = t * P.sp * 1.1;
        ctx.fillStyle = P.col;
        if (o.kind === 'spin') {
          ctx.beginPath(); ctx.arc(P.cx, cy, R * 0.7, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(P.cx, cy); ctx.lineTo(P.cx + Math.cos(a) * R * 0.6, cy + Math.sin(a) * R * 0.6); ctx.stroke();
        } else {
          ctx.beginPath(); ctx.arc(P.cx + Math.cos(a) * R, cy + Math.sin(a) * R, 5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = muted(); ctx.font = '10px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(P.nm, P.cx, H - 8);
      }
    }

    else {
      const p = Math.max(0.02, Math.min(1, o.s));
      const y = H / 2 - 6, pad = 16;
      ctx.fillStyle = sunk(); ctx.fillRect(pad, y, W - pad * 2, 12);
      ctx.fillStyle = o.hue; ctx.fillRect(pad, y, (W - pad * 2) * p * (reduced ? 1 : Math.min(1, t * 1.5)), 12);
      ctx.fillStyle = ink(); ctx.font = '700 12px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(o.v, W / 2, H - 12);
    }

    raf = requestAnimationFrame(draw);
  }
  raf = requestAnimationFrame(draw);

  return { destroy() { cancelAnimationFrame(raf); ro.disconnect(); }, caption };
}
