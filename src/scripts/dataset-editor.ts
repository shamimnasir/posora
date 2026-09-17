/** JSON document editor: validate as you type, save only what parses. */

const keyNode = document.getElementById('dataset-key');
const doc = document.getElementById('doc') as HTMLTextAreaElement | null;
if (keyNode && doc) init(JSON.parse(keyNode.textContent || '""') as string, doc);

function init(key: string, doc: HTMLTextAreaElement) {
  const status = document.getElementById('status')!;
  const msg = document.getElementById('msg')!;
  const size = document.getElementById('size')!;
  const saveBtn = document.getElementById('save') as HTMLButtonElement;
  const original = doc.value;
  let dirty = false;

  const showSize = () => {
    size.textContent = `${(new Blob([doc.value]).size / 1024).toFixed(1)} KB`;
  };

  /** Returns the parsed value, or null and a visible message. */
  const check = (): { ok: true; value: unknown } | { ok: false } => {
    try {
      const value = JSON.parse(doc.value);
      msg.textContent = '';
      msg.className = '';
      return { ok: true, value };
    } catch (e) {
      msg.textContent = `JSON ভুল: ${(e as Error).message}`;
      msg.className = 'err';
      return { ok: false };
    }
  };

  doc.addEventListener('input', () => {
    dirty = doc.value !== original;
    status.textContent = dirty ? 'অসংরক্ষিত পরিবর্তন' : 'অপরিবর্তিত';
    status.className = dirty ? 'status dirty' : 'status';
    showSize();
    check();
  });

  document.getElementById('format')?.addEventListener('click', () => {
    const parsed = check();
    if (!parsed.ok) return;
    doc.value = JSON.stringify(parsed.value, null, 2);
    showSize();
  });

  document.getElementById('revert')?.addEventListener('click', () => {
    if (dirty && !confirm('অসংরক্ষিত পরিবর্তন বাতিল হবে। ঠিক আছে?')) return;
    doc.value = original;
    dirty = false;
    status.textContent = 'অপরিবর্তিত';
    status.className = 'status';
    showSize();
    check();
  });

  saveBtn?.addEventListener('click', async () => {
    if (!check().ok) {
      status.textContent = 'JSON ঠিক করো';
      status.className = 'status failed';
      return;
    }
    saveBtn.disabled = true;
    status.textContent = 'সংরক্ষণ হচ্ছে…';
    status.className = 'status';
    try {
      const res = await fetch('/api/admin/dataset', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key, json: doc.value }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      dirty = false;
      status.textContent = 'সংরক্ষিত ✓';
      status.className = 'status saved';
    } catch (e) {
      status.textContent = `ব্যর্থ: ${(e as Error).message}`;
      status.className = 'status failed';
    } finally {
      saveBtn.disabled = false;
    }
  });

  window.addEventListener('beforeunload', (e) => {
    if (!dirty) return;
    e.preventDefault();
  });

  showSize();
}
