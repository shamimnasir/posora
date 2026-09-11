/**
 * Client half of the world editor.
 *
 * Renders the repeatable sections (categories, key interactions, missions) from
 * the JSON the page embedded, tracks dirtiness, and posts the whole world back
 * as one document. Kept in a module rather than an inline script because the
 * site's CSP is `script-src 'self'`.
 */

type Cat = { n: string; items: string[]; play: string };
type Mission = { n: string; d: string };
type World = {
  slug: string; bn: string; en: string; tag: string; hue: string;
  age: string; dep: string; phase: string; intro: string;
  keys: string[]; keyCats: (number | null)[];
  cats: Cat[]; missions: Mission[]; missionCats: (number | null)[];
  open: boolean; status: string; sort: number;
};

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...kids: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  for (const kid of kids) n.append(kid);
  return n;
}

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

function start(initial: World, creating: boolean) {
  // Working copy; the DOM is a view over this.
  const state: World = structuredClone(initial);
  const original = JSON.stringify(state);

  const catsBox = $('cats');
  const keysBox = $('keys');
  const missionsBox = $('missions');
  const statusLine = $('status');
  const form = $<HTMLFormElement>('editor');

  let dirty = false;
  const markDirty = () => {
    dirty = true;
    statusLine.textContent = 'অসংরক্ষিত পরিবর্তন';
    statusLine.className = 'status dirty';
  };

  /* ---------- scalar fields ---------- */

  const scalars: [string, keyof World][] = [
    ['f-slug', 'slug'], ['f-bn', 'bn'], ['f-en', 'en'], ['f-tag', 'tag'],
    ['f-age', 'age'], ['f-dep', 'dep'], ['f-phase', 'phase'], ['f-intro', 'intro'],
    ['f-hue', 'hue'], ['f-status', 'status'],
  ];
  for (const [id, key] of scalars) {
    const input = $<HTMLInputElement>(id);
    input?.addEventListener('input', () => {
      (state as Record<string, unknown>)[key] = input.value;
      markDirty();
    });
  }
  $<HTMLInputElement>('f-sort')?.addEventListener('input', (e) => {
    state.sort = Number((e.target as HTMLInputElement).value) || 0;
    markDirty();
  });
  $<HTMLSelectElement>('f-open')?.addEventListener('change', (e) => {
    state.open = (e.target as HTMLSelectElement).value === 'true';
    markDirty();
  });

  // Keep the colour picker and its hex field in step.
  const picker = $<HTMLInputElement>('f-hue-picker');
  const hex = $<HTMLInputElement>('f-hue');
  picker?.addEventListener('input', () => {
    hex.value = picker.value;
    state.hue = picker.value;
    markDirty();
  });
  hex?.addEventListener('input', () => {
    if (/^#[0-9a-fA-F]{6}$/.test(hex.value)) picker.value = hex.value;
  });

  /* ---------- categories ---------- */

  function renderCats() {
    catsBox.replaceChildren();
    $('cats-empty').hidden = state.cats.length > 0;

    state.cats.forEach((cat, i) => {
      const box = el('div', { class: 'rep' });

      const up = el('button', { class: 'btn btn-sm', type: 'button', ...(i === 0 ? { disabled: '' } : {}) }, '↑');
      const down = el('button', { class: 'btn btn-sm', type: 'button', ...(i === state.cats.length - 1 ? { disabled: '' } : {}) }, '↓');
      const del = el('button', { class: 'btn btn-sm btn-danger', type: 'button' }, 'মুছো');
      up.onclick = () => { move(state.cats, i, -1); remapAfterMove(i, i - 1); renderAll(); };
      down.onclick = () => { move(state.cats, i, 1); remapAfterMove(i, i + 1); renderAll(); };
      del.onclick = () => {
        if (!confirm(`“${cat.n || 'বিভাগ'}” মুছে ফেলবে?`)) return;
        state.cats.splice(i, 1);
        remapAfterDelete(i);
        renderAll();
      };

      box.append(el('header', {}, el('b', {}, `বিভাগ ${i + 1}`), el('span', { class: 'row' }, up, down, del)));

      const name = el('input', { type: 'text', value: cat.n, placeholder: 'বিভাগের নাম' });
      name.addEventListener('input', () => { cat.n = name.value; markDirty(); refreshCatOptions(); });
      box.append(el('label', { class: 'f' }, el('span', {}, 'নাম'), name));

      // Items as removable chips plus an add field.
      const chips = el('div', { class: 'chips' });
      const paint = () => {
        chips.replaceChildren();
        cat.items.forEach((item, j) => {
          const x = el('button', { type: 'button', 'aria-label': `${item} মুছো` }, '×');
          x.onclick = () => { cat.items.splice(j, 1); markDirty(); paint(); };
          chips.append(el('span', { class: 'chip' }, item, x));
        });
      };
      paint();

      const adder = el('input', { type: 'text', placeholder: 'আইটেম লিখে Enter চাপো' });
      adder.addEventListener('keydown', (e) => {
        if ((e as KeyboardEvent).key !== 'Enter') return;
        e.preventDefault();
        const v = adder.value.trim();
        if (!v) return;
        // One paste can add many: split on commas and newlines.
        for (const part of v.split(/[,\n]/).map((s) => s.trim()).filter(Boolean)) cat.items.push(part);
        adder.value = '';
        markDirty();
        paint();
      });

      const itemsLabel = el('label', { class: 'f' }, el('span', {}, `আইটেম (${cat.items.length}টি)`));
      itemsLabel.append(chips, adder);
      box.append(itemsLabel);

      const play = el('textarea', { rows: '2', placeholder: 'এই বিভাগে কী করা যায়' });
      play.value = cat.play;
      play.addEventListener('input', () => { cat.play = play.value; markDirty(); });
      box.append(el('label', { class: 'f' }, el('span', {}, 'খেলার বর্ণনা'), play));

      catsBox.append(box);
    });
  }

  /** A category select bound to one slot of keyCats / missionCats. */
  function catSelect(current: number | null, onPick: (v: number | null) => void) {
    const sel = el('select', { class: 'cat-ref' });
    sel.append(el('option', { value: '' }, '— এখনো নেই —'));
    state.cats.forEach((c, i) => {
      const o = el('option', { value: String(i) }, c.n || `বিভাগ ${i + 1}`);
      if (current === i) o.setAttribute('selected', '');
      sel.append(o);
    });
    sel.value = current === null || current === undefined ? '' : String(current);
    sel.addEventListener('change', () => {
      onPick(sel.value === '' ? null : Number(sel.value));
      markDirty();
    });
    return sel;
  }

  /** Re-label the category dropdowns after a rename, without losing selections. */
  function refreshCatOptions() {
    for (const sel of document.querySelectorAll<HTMLSelectElement>('select.cat-ref')) {
      const keep = sel.value;
      sel.replaceChildren(el('option', { value: '' }, '— এখনো নেই —'));
      state.cats.forEach((c, i) => sel.append(el('option', { value: String(i) }, c.n || `বিভাগ ${i + 1}`)));
      sel.value = keep;
    }
  }

  /* ---------- key interactions & missions ---------- */

  function renderKeys() {
    keysBox.replaceChildren();
    state.keys.forEach((key, i) => {
      const row = el('div', { class: 'rep' });
      const text = el('input', { type: 'text', value: key, placeholder: 'যেমন: থ্রিডি অরবিট' });
      text.addEventListener('input', () => { state.keys[i] = text.value; markDirty(); });

      const del = el('button', { class: 'btn btn-sm btn-danger', type: 'button' }, 'মুছো');
      del.onclick = () => { state.keys.splice(i, 1); state.keyCats.splice(i, 1); renderKeys(); markDirty(); };

      row.append(
        el('header', {}, el('b', {}, `ইন্টারঅ্যাকশন ${i + 1}`), del),
        el('label', { class: 'f' }, el('span', {}, 'নাম'), text),
        el('label', { class: 'f' }, el('span', {}, 'কোন বিভাগে কাজ করে'),
          catSelect(state.keyCats[i] ?? null, (v) => { state.keyCats[i] = v; })),
      );
      keysBox.append(row);
    });
  }

  function renderMissions() {
    missionsBox.replaceChildren();
    state.missions.forEach((m, i) => {
      const row = el('div', { class: 'rep' });
      const name = el('input', { type: 'text', value: m.n, placeholder: 'মিশনের নাম' });
      name.addEventListener('input', () => { m.n = name.value; markDirty(); });
      const desc = el('textarea', { rows: '2', placeholder: 'কী করতে হবে' });
      desc.value = m.d;
      desc.addEventListener('input', () => { m.d = desc.value; markDirty(); });

      const del = el('button', { class: 'btn btn-sm btn-danger', type: 'button' }, 'মুছো');
      del.onclick = () => { state.missions.splice(i, 1); state.missionCats.splice(i, 1); renderMissions(); markDirty(); };

      row.append(
        el('header', {}, el('b', {}, `মিশন ${i + 1}`), del),
        el('label', { class: 'f' }, el('span', {}, 'নাম'), name),
        el('label', { class: 'f' }, el('span', {}, 'বর্ণনা'), desc),
        el('label', { class: 'f' }, el('span', {}, 'কোন বিভাগে করা যায়'),
          catSelect(state.missionCats[i] ?? null, (v) => { state.missionCats[i] = v; })),
      );
      missionsBox.append(row);
    });
  }

  const renderAll = () => { renderCats(); renderKeys(); renderMissions(); markDirty(); };

  /* ---------- index bookkeeping ---------- */

  function move<T>(arr: T[], i: number, delta: number) {
    const j = i + delta;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }

  /** Categories moved, so references to them must follow. */
  function remapAfterMove(from: number, to: number) {
    const swap = (v: number | null) => (v === from ? to : v === to ? from : v);
    state.keyCats = state.keyCats.map(swap);
    state.missionCats = state.missionCats.map(swap);
  }

  /** A category vanished: drop references to it and shift the ones above down. */
  function remapAfterDelete(gone: number) {
    const fix = (v: number | null) => (v === null ? null : v === gone ? null : v > gone ? v - 1 : v);
    state.keyCats = state.keyCats.map(fix);
    state.missionCats = state.missionCats.map(fix);
  }

  /* ---------- add buttons ---------- */

  document.querySelectorAll<HTMLButtonElement>('[data-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const kind = btn.dataset.add;
      if (kind === 'cat') { state.cats.push({ n: '', items: [], play: '' }); renderCats(); }
      if (kind === 'key') { state.keys.push(''); state.keyCats.push(null); renderKeys(); }
      if (kind === 'mission') { state.missions.push({ n: '', d: '' }); state.missionCats.push(null); renderMissions(); }
      markDirty();
    });
  });

  /* ---------- save / revert / delete ---------- */

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const save = $<HTMLButtonElement>('save');
    save.disabled = true;
    statusLine.textContent = 'সংরক্ষণ হচ্ছে…';
    statusLine.className = 'status';

    try {
      const res = await fetch('/api/admin/world', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...state, create: creating }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; slug?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);

      dirty = false;
      statusLine.textContent = 'সংরক্ষিত ✓';
      statusLine.className = 'status saved';
      // A new world lives at its own URL from here on.
      if (creating && data.slug) location.href = `/admin/worlds/${data.slug}`;
    } catch (err) {
      statusLine.textContent = `ব্যর্থ: ${(err as Error).message}`;
      statusLine.className = 'status failed';
    } finally {
      save.disabled = false;
    }
  });

  $('revert')?.addEventListener('click', () => {
    if (dirty && !confirm('সব অসংরক্ষিত পরিবর্তন বাতিল হবে। ঠিক আছে?')) return;
    location.reload();
  });

  $('delete')?.addEventListener('click', async () => {
    if (!confirm(`“${state.bn}” পুরোপুরি মুছে ফেলবে? এটি ফেরানো যাবে না।`)) return;
    const res = await fetch(`/api/admin/world?slug=${encodeURIComponent(state.slug)}`, { method: 'DELETE' });
    if (res.ok) location.href = '/admin/worlds';
    else alert('মুছতে ব্যর্থ হয়েছে।');
  });

  // Don't let a stray click throw away work.
  window.addEventListener('beforeunload', (e) => {
    if (!dirty || JSON.stringify(state) === original) return;
    e.preventDefault();
    e.returnValue = '';
  });

  renderCats();
  renderKeys();
  renderMissions();
  dirty = false;
  statusLine.textContent = 'অপরিবর্তিত';
  statusLine.className = 'status';
}

// Bootstrap last: `start` reads module-level consts above, which are only
// initialised once this point is reached.
const node = document.getElementById('world-data');
if (node) {
  const { world, creating } = JSON.parse(node.textContent || '{}') as { world: World; creating: boolean };
  start(world, creating);
}
